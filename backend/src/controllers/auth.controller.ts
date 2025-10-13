import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/errorHandler';
import axios from 'axios';

const prisma = new PrismaClient();

export class AuthController {
  // Verify Azure AD token and sync user
  async verifyAzureToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError(400, 'Token is required');
      }

      // Decode the Azure AD token (in production, verify signature)
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.oid || !decoded.preferred_username) {
        throw new ApiError(401, 'Invalid token format');
      }

      // Extract user info from Azure AD token
      const azureId = decoded.oid;
      const email = decoded.preferred_username || decoded.email;
      const name = decoded.name || email.split('@')[0];

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { azureId }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name,
            azureId,
            role: 'USER', // Default role
            status: 'ACTIVE'
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            userId: user.id,
            action: 'USER_REGISTERED',
            description: `New user registered: ${email}`
          }
        });
      } else {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.session.create({
        data: {
          userId: user.id,
          token: jwtToken,
          expiresAt
        }
      });

      res.json({
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Auth verification error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  }

  // Get current user profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json(user);
    } catch (error: any) {
      console.error('Get profile error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get profile' });
      }
    }
  }

  // Refresh token
  async refreshToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      // Generate new JWT token
      const newToken = jwt.sign(
        { 
          userId: req.user.id, 
          email: req.user.email, 
          role: req.user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Update session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.session.create({
        data: {
          userId: req.user.id,
          token: newToken,
          expiresAt
        }
      });

      res.json({ token: newToken });
    } catch (error: any) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  // Logout
  async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Delete session
        await prisma.session.deleteMany({
          where: { token }
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }
}