import express from 'express';
import { getDashboardData, getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Dashboard statistics endpoint
router.get('/stats', getDashboardStats);

// Alternative dashboard data endpoint
router.get('/data', getDashboardData);

export default router;