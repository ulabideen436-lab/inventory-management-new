import express from 'express';
import { getTransactions, getDetailedTransactions } from '../controllers/transactionsController.js';
import { authorizeRoles } from '../middleware/auth.js';
const router = express.Router();

router.get('/', authorizeRoles('owner'), getTransactions);
router.get('/detailed', authorizeRoles('owner'), getDetailedTransactions);

export default router;
