import express from 'express';
import { addCustomer, addCustomerPayment, deleteCustomer, getCustomerById, getCustomerHistory, getCustomerLedger, getCustomerPayment, getCustomerPayments, getCustomers, recalculateCustomerBalance, updateCustomer, updateCustomerPayment } from '../controllers/customersController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
import { customerIntegrityStack } from '../middleware/dataIntegrity.js';

const router = express.Router();

// Delete a customer by ID
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deleteCustomer);
// Record payment received from customer
router.post('/:id/payments', authorizeRoles('owner'), addCustomerPayment);
// Get customer payments
router.get('/:id/payments', authorizeRoles('owner'), getCustomerPayments);
// Get specific customer payment
router.get('/:id/payments/:paymentId', authorizeRoles('owner'), getCustomerPayment);
// Update specific customer payment
router.put('/:id/payments/:paymentId', authorizeRoles('owner'), updateCustomerPayment);
// Recalculate customer balance
router.post('/:id/recalculate-balance', authorizeRoles('owner'), recalculateCustomerBalance);

router.get('/', getCustomers);
router.post('/', authorizeRoles('owner'), ...customerIntegrityStack, addCustomer);
router.put('/:id', authorizeRoles('owner'), ...customerIntegrityStack, updateCustomer);

// Get a single customer by ID
router.get('/:id', getCustomerById);
router.get('/:id/ledger', authorizeRoles('owner'), getCustomerLedger);
router.get('/:id/history', getCustomerHistory);
router.get('/:id/transactions', getCustomerHistory); // Alias for transactions

export default router;