import express from 'express';
import { getDashboardStats, getInventoryReport, getReports, getSalesReport } from '../controllers/reportsController.js';
import { authorizeRoles } from '../middleware/auth.js';
const router = express.Router();

router.get('/', authorizeRoles('owner'), getReports);
router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);

export default router;
