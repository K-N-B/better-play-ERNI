import express from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const dashboardController = new DashboardController();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get recent activity
router.get('/activity', dashboardController.getRecentActivity);

// Get user growth data
router.get('/user-growth', dashboardController.getUserGrowth);

// Get system health
router.get('/health', dashboardController.getSystemHealth);

export default router;