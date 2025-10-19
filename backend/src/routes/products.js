import express from 'express';
import { addProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productsController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';
import { productIntegrityStack } from '../middleware/dataIntegrity.js';
import { validateProduct } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search', getProducts); // Search is handled by getProducts with query params
router.get('/:id', getProductById);
router.post('/', authorizeRoles('owner'), ...productIntegrityStack, validateProduct, addProduct);
router.put('/:id', authorizeRoles('owner'), ...productIntegrityStack, updateProduct);
router.delete('/:id', authorizeRoles('owner'), verifyPassword, deleteProduct);

export default router;
