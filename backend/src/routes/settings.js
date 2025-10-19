import express from 'express';
import {
    createBackup,
    exportData,
    getSettings,
    getSystemStats,
    updateSettings
} from '../controllers/settingsController.js';

const router = express.Router();

// Get system settings (owner only)
router.get('/', getSettings);

// Update system settings (owner only)
router.post('/', updateSettings);

// Get system statistics (owner only)
router.get('/stats', getSystemStats);

// Export data (owner only)
router.get('/export/data', exportData);

// Create backup (owner only)
router.post('/backup/database', createBackup);

export default router;