import express from 'express';
import { createPayment, deletePayment, getPayment, getPayments, updatePayment } from '../controllers/paymentsController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
const router = express.Router();

router.post('/', authorizeRoles('owner'), createPayment);
router.get('/', authorizeRoles('owner'), getPayments);
router.get('/:id', authorizeRoles('owner'), getPayment);
router.put('/:id', authorizeRoles('owner'), updatePayment);
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deletePayment);

export default router;
