import express from 'express';
import {
    createUser,
    deactivateUser,
    deleteUser,
    getUserProfile,
    getUsers,
    reactivateUser,
    updateUser,
    updateUserProfile
} from '../controllers/usersController.js';

const router = express.Router();

// Get all users (owner only)
router.get('/', getUsers);

// Get current user profile
router.get('/profile', getUserProfile);

// Update current user profile
router.put('/profile', updateUserProfile);

// Create new user (owner only)
router.post('/', createUser);

// Update user (owner only)
router.put('/:userId', updateUser);

// Delete user (owner only)
router.delete('/:userId', deleteUser);

// Deactivate user (owner only)
router.patch('/:userId/deactivate', deactivateUser);

// Reactivate user (owner only)
router.patch('/:userId/reactivate', reactivateUser);

export default router;