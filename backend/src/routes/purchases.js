import express from 'express';
import { createPurchase, deletePurchase, getPurchaseById, getPurchases, updatePurchase } from '../controllers/purchasesController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
const router = express.Router();

router.post('/', authorizeRoles('owner'), createPurchase);
router.get('/', authorizeRoles('owner'), getPurchases);
router.get('/:id', authorizeRoles('owner'), getPurchaseById);
router.put('/:id', authorizeRoles('owner'), updatePurchase);
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deletePurchase);

export default router;
