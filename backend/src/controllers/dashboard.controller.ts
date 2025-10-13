import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class DashboardController {
  // Get dashboard statistics
  async getStats(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Get total users
      const totalUsers = await prisma.user.count();
      const lastMonthUsers = await prisma.user.count({
        where: { createdAt: { gte: lastMonth } }
      });

      // Get active sessions (users logged in within last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activeSessions = await prisma.user.count({
        where: {
          lastLogin: { gte: last24Hours },
          status: 'ACTIVE'
        }
      });

      // Get total puzzles
      const totalPuzzles = await prisma.puzzle.count();
      const lastMonthPuzzles = await prisma.puzzle.count({
        where: { createdAt: { gte: lastMonth } }
      });

      // Get completion rate
      const totalCompletions = await prisma.puzzleCompletion.count();
      const publishedPuzzles = await prisma.puzzle.count({
        where: { status: 'PUBLISHED' }
      });
      const completionRate = publishedPuzzles > 0 
        ? Math.round((totalCompletions / publishedPuzzles) * 100) 
        : 0;

      // Calculate growth percentages
      const userGrowth = lastMonthUsers > 0 
        ? `+${Math.round((lastMonthUsers / totalUsers) * 100)}%` 
        : '0%';
      const puzzleGrowth = lastMonthPuzzles > 0 
        ? `+${Math.round((lastMonthPuzzles / totalPuzzles) * 100)}%` 
        : '0%';

      res.json([
        {
          label: 'Total Users',
          value: totalUsers.toLocaleString(),
          change: userGrowth,
          trend: 'up'
        },
        {
          label: 'Active Sessions',
          value: activeSessions.toLocaleString(),
          change: '+5%',
          trend: 'up'
        },
        {
          label: 'Puzzles Created',
          value: totalPuzzles.toLocaleString(),
          change: puzzleGrowth,
          trend: 'up'
        },
        {
          label: 'Completion Rate',
          value: `${completionRate}%`,
          change: '+3%',
          trend: 'up'
        }
      ]);
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  // Get recent activity
  async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      const activities = await prisma.activity.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        user: activity.user.email,
        userName: activity.user.name,
        createdAt: activity.createdAt,
        timeAgo: getTimeAgo(activity.createdAt)
      }));

      res.json(formattedActivities);
    } catch (error: any) {
      console.error('Get recent activity error:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  }

  // Get user growth data (for charts)
  async getUserGrowth(req: AuthRequest, res: Response) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by day
      const growthData: { [key: string]: number } = {};
      users.forEach(user => {
        const date = user.createdAt.toISOString().split('T')[0];
        growthData[date] = (growthData[date] || 0) + 1;
      });

      const result = Object.entries(growthData).map(([date, count]) => ({
        date,
        users: count
      }));

      res.json(result);
    } catch (error: any) {
      console.error('Get user growth error:', error);
      res.status(500).json({ error: 'Failed to fetch user growth data' });
    }
  }

  // Get system health metrics
  async getSystemHealth(req: AuthRequest, res: Response) {
    try {
      const dbStatus = await checkDatabaseHealth();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      res.json({
        status: 'healthy',
        database: dbStatus,
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        },
        uptime: `${Math.floor(uptime / 3600)} hours`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Get system health error:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }
}

// Helper function to check database health
async function checkDatabaseHealth(): Promise<string> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    return 'disconnected';
  }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
}