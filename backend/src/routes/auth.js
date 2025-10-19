import express from 'express';
import { changePassword, getUserProfile, login, logout, register, verifyPassword } from '../controllers/authController.js';
import { authenticateJWT, authLimiter } from '../middleware/auth.js';

const router = express.Router();

// Public routes with rate limiting (but owner is exempted)
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);

// Protected routes
router.get('/verify', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
});
router.post('/change-password', authenticateJWT, changePassword);
router.post('/logout', authenticateJWT, logout);
router.get('/profile', authenticateJWT, getUserProfile);
router.post('/verify-password', authenticateJWT, verifyPassword);

export default router;
