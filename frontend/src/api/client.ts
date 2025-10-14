import express from 'express';
import type { Request, Response, NextFunction } from 'express';

    import cors from 'cors';
    import dotenv from 'dotenv';
    import jwt from 'jsonwebtoken';
    import { Pool } from 'pg';

    dotenv.config();

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Database connection
    const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erni_puzzle_db',
    password: process.env.DB_PASSWORD || 'your_password',
    port: parseInt(process.env.DB_PORT || '5432'),
    });

    // Middleware
    app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    }));
    app.use(express.json());

    // Types
    interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        roles: string[];
    };
    }

    // Authentication middleware
    const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Verify the Microsoft token (simplified - in production, validate with Microsoft)
        const decoded = jwt.decode(token) as any;
        
        if (!decoded) {
        return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = {
        id: decoded.oid || decoded.sub,
        email: decoded.email || decoded.preferred_username,
        name: decoded.name,
        roles: decoded.roles || ['User'],
        };

        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token validation failed' });
    }
    };

    // Role-based authorization middleware
    const authorizeRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
        }

        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
        
        if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
    };

    // Initialize database tables
    const initDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            avatar TEXT,
            roles TEXT[] DEFAULT ARRAY['User']::TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS puzzles (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            content JSONB NOT NULL,
            correct_answer TEXT NOT NULL,
            date_available DATE NOT NULL,
            points_value INTEGER DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_puzzle_results (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) REFERENCES users(id),
            puzzle_id INTEGER REFERENCES puzzles(id),
            points_earned INTEGER NOT NULL,
            time_taken INTEGER NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, puzzle_id)
        );

        CREATE TABLE IF NOT EXISTS leaderboard_summary (
            user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
            daily_points INTEGER DEFAULT 0,
            weekly_points INTEGER DEFAULT 0,
            monthly_points INTEGER DEFAULT 0,
            all_time_points INTEGER DEFAULT 0,
            streak_count INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_puzzle_date ON puzzles(date_available);
        CREATE INDEX IF NOT EXISTS idx_user_results ON user_puzzle_results(user_id, completed_at);
        `);
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        client.release();
    }
    };

    // Routes

    // Health check
    app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
    });

    // User registration/login (sync with Azure AD)
    app.post('/api/auth/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const { id, email, name, roles } = req.user!;

        // Upsert user
        const result = await client.query(
        `INSERT INTO users (id, name, email, roles, last_login)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            roles = EXCLUDED.roles,
            last_login = CURRENT_TIMESTAMP
        RETURNING *`,
        [id, name, email, roles]
        );

        // Initialize leaderboard entry
        await client.query(
        `INSERT INTO leaderboard_summary (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING`,
        [id]
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Auth sync error:', error);
        res.status(500).json({ error: 'Failed to sync user data' });
    } finally {
        client.release();
    }
    });

    // Get current user profile
    app.get('/api/user/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
        'SELECT id, name, email, avatar, roles, created_at, last_login FROM users WHERE id = $1',
        [req.user!.id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    } finally {
        client.release();
    }
    });

    // Admin: Get all users
    app.get('/api/admin/users', authenticateToken, authorizeRole(['Admin']), async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
        `SELECT u.id, u.name, u.email, u.roles, u.created_at, u.last_login,
                COALESCE(l.all_time_points, 0) as all_time_points
        FROM users u
        LEFT JOIN leaderboard_summary l ON u.id = l.user_id
        ORDER BY u.created_at DESC`
        );

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
        client.release();
    }
    });

    // Admin: Get dashboard statistics
    app.get('/api/admin/stats', authenticateToken, authorizeRole(['Admin']), async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const [usersCount, puzzlesCount, completionsCount] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM users'),
        client.query('SELECT COUNT(*) as count FROM puzzles'),
        client.query('SELECT COUNT(*) as count FROM user_puzzle_results'),
        ]);

        res.json({
        totalUsers: parseInt(usersCount.rows[0].count),
        totalPuzzles: parseInt(puzzlesCount.rows[0].count),
        totalCompletions: parseInt(completionsCount.rows[0].count),
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    } finally {
        client.release();
    }
    });

    // User: Get leaderboard
    app.get('/api/leaderboard', authenticateToken, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const { period = 'all_time' } = req.query;
        const pointsColumn = `${period}_points`;

        const result = await client.query(
        `SELECT u.id, u.name, u.avatar, l.${pointsColumn} as points, l.streak_count
        FROM leaderboard_summary l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.${pointsColumn} DESC
        LIMIT 100`
        );

        res.json({ leaderboard: result.rows });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    } finally {
        client.release();
    }
    });

    // User: Get user statistics
    app.get('/api/user/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
        `SELECT daily_points, weekly_points, monthly_points, all_time_points, streak_count
        FROM leaderboard_summary
        WHERE user_id = $1`,
        [req.user!.id]
        );

        if (result.rows.length === 0) {
        return res.json({
            daily_points: 0,
            weekly_points: 0,
            monthly_points: 0,
            all_time_points: 0,
            streak_count: 0,
        });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    } finally {
        client.release();
    }
    });

    // Start server
    const startServer = async () => {
    try {
        await initDatabase();
        app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
    };

    startServer();