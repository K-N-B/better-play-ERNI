import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

// Verify Azure AD token and create/update user
router.post('/verify', authController.verifyAzureToken);

// Get current user profile
router.get('/profile', authenticateToken, authController.getProfile);

// Refresh token
router.post('/refresh', authenticateToken, authController.refreshToken);

// Logout
router.post('/logout', authenticateToken, authController.logout);

export default router;