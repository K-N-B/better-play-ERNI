import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class UserController {
  // Get all users
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const { search, role, status, page = '1', limit = '10' } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Get user by ID
  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              puzzles: true,
              activities: true
            }
          }
        }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json(user);
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
    }
  }

  // Create user
  async createUser(req: AuthRequest, res: Response) {
    try {
      const { email, name, role, status } = req.body;

      if (!email) {
        throw new ApiError(400, 'Email is required');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
      }

      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: role || 'USER',
          status: status || 'ACTIVE'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          action: 'USER_CREATED',
          description: `Created user: ${email}`,
          metadata: { createdUserId: user.id }
        }
      });

      res.status(201).json(user);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  }

  // Update user
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          updatedAt: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          action: 'USER_UPDATED',
          description: `Updated user: ${user.email}`,
          metadata: { updatedUserId: id, changes: updateData }
        }
      });

      res.json(user);
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // Delete user
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user!.id) {
        throw new ApiError(400, 'Cannot delete your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { email: true }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      await prisma.user.delete({
        where: { id }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          action: 'USER_DELETED',
          description: `Deleted user: ${user.email}`,
          metadata: { deletedUserId: id }
        }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  }

  // Update user status
  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        throw new ApiError(400, 'Invalid status');
      }

      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          email: true,
          name: true,
          status: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          action: 'USER_STATUS_CHANGED',
          description: `Changed user status to ${status}: ${user.email}`,
          metadata: { userId: id, newStatus: status }
        }
      });

      res.json(user);
    } catch (error: any) {
      console.error('Update user status error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user status' });
      }
    }
  }

  // Update user role
  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
        throw new ApiError(400, 'Invalid role');
      }

      // Prevent self-role change
      if (id === req.user!.id) {
        throw new ApiError(400, 'Cannot change your own role');
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          action: 'USER_ROLE_CHANGED',
          description: `Changed user role to ${role}: ${user.email}`,
          metadata: { userId: id, newRole: role }
        }
      });

      res.json(user);
    } catch (error: any) {
      console.error('Update user role error:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user role' });
      }
    }
  }
}