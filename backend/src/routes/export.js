import express from 'express';
import { backupDatabase, exportData, getBackupStatus } from '../controllers/exportController.js';
import { requireOwnerRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /export/data
 * @desc Export all system data as JSON
 * @access Private (Owner only)
 */
router.get('/data', requireOwnerRole, exportData);

/**
 * @route POST /backup/database
 * @desc Create a complete database backup
 * @access Private (Owner only)
 */
router.post('/database', requireOwnerRole, backupDatabase);

/**
 * @route GET /backup/status
 * @desc Get backup system status and available backups
 * @access Private (Owner only)
 */
router.get('/status', requireOwnerRole, getBackupStatus);

export default router;