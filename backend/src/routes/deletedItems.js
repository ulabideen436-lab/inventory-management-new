import express from 'express';
import { getAllDeletedItems, getStats, permanentlyDelete, restoreItem } from '../controllers/deletedItemsController.js';
import { authorizeRoles, verifyPassword } from '../middleware/auth.js';

const router = express.Router();

// Get all deleted items with filtering
router.get('/', authorizeRoles('owner'), getAllDeletedItems);

// Get deletion statistics
router.get('/stats', authorizeRoles('owner'), getStats);

// Restore a deleted item
router.post('/:deletedItemId/restore', authorizeRoles('owner'), verifyPassword, restoreItem);

// Permanently delete an item from history
router.delete('/:deletedItemId', authorizeRoles('owner'), verifyPassword, permanentlyDelete);

export default router;