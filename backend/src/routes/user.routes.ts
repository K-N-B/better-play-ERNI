import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user (admin only)
router.post('/', requireAdmin, userController.createUser);

// Update user (admin only)
router.put('/:id', requireAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireAdmin, userController.deleteUser);

// Update user status (admin only)
router.patch('/:id/status', requireAdmin, userController.updateUserStatus);

// Update user role (admin only)
router.patch('/:id/role', requireAdmin, userController.updateUserRole);

export default router;