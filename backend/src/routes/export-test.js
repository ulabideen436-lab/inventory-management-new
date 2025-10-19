import express from 'express';
import { requireOwnerRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Simple test endpoint to see if the routing works
 */
router.get('/test', requireOwnerRole, (req, res) => {
    res.json({ message: 'Export routes are working!' });
});

export default router;