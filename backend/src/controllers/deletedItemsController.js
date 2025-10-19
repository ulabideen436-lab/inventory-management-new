import { getDeletedItems, getDeletionStats, permanentlyDeleteItem, restoreDeletedItem } from '../services/deletedItemsService.js';

// Get all deleted items with filtering and pagination
export async function getAllDeletedItems(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const filters = {
            item_type: req.query.item_type,
            deleted_by: req.query.deleted_by,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            can_restore: req.query.can_restore !== undefined ? req.query.can_restore === 'true' : undefined,
            search: req.query.search,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const deletedItems = await getDeletedItems(filters);
        res.json(deletedItems);
    } catch (error) {
        console.error('Error fetching deleted items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Restore a deleted item
export async function restoreItem(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { deletedItemId } = req.params;
        const restoredBy = req.user.id;

        const result = await restoreDeletedItem(deletedItemId, restoredBy);

        res.json({
            message: 'Item restored successfully',
            restoredItem: result.restoredItem
        });
    } catch (error) {
        console.error('Error restoring item:', error);
        res.status(500).json({
            message: error.message || 'Failed to restore item'
        });
    }
}

// Permanently delete an item from deleted items history
export async function permanentlyDelete(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { deletedItemId } = req.params;

        await permanentlyDeleteItem(deletedItemId);

        res.json({
            message: 'Item permanently deleted from history'
        });
    } catch (error) {
        console.error('Error permanently deleting item:', error);
        res.status(500).json({
            message: error.message || 'Failed to permanently delete item'
        });
    }
}

// Get deletion statistics
export async function getStats(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const stats = await getDeletionStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching deletion stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}