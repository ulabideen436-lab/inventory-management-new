import express from 'express';
import { addSupplier, deleteSupplier, getSupplierHistory, getSuppliers, updateSupplier } from '../controllers/suppliersController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
const router = express.Router();

router.get('/', getSuppliers);
router.post('/', authorizeRoles('owner'), addSupplier);
router.put('/:id', authorizeRoles('owner'), updateSupplier);
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deleteSupplier);
router.get('/:id/history', getSupplierHistory);

export default router;
