import express from 'express';
import { addCustomerTypeColumn, createSale, deleteSale, getSale, getSales, getSoldProducts, updateSale } from '../controllers/salesController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
import { cashierPOSIntegrityStack } from '../middleware/dataIntegrity.js';

const router = express.Router();

// Apply data integrity middleware to sale creation
router.post('/', authorizeRoles('cashier', 'owner'), ...cashierPOSIntegrityStack, createSale);
router.get('/sold-products', authorizeRoles('owner'), getSoldProducts);
router.get('/', authorizeRoles('owner'), getSales);
router.get('/:id', authorizeRoles('owner'), getSale);
router.put('/:id', authorizeRoles('owner'), updateSale);
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deleteSale);

// Migration route - only for owner
router.post('/migrate/add-customer-type', authorizeRoles('owner'), addCustomerTypeColumn);

export default router;
