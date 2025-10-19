import { pool } from '../models/db.js';

/**
 * Deleted Items Service
 * Handles soft delete, restoration, and permanent deletion of items
 */

// Store an item in the deleted_items table before deletion
export async function storeDeletedItem(itemType, itemId, originalData, deletedBy, deletionReason = null) {
    try {
        const [result] = await pool.query(`
            INSERT INTO deleted_items (item_type, item_id, original_data, deleted_by, deletion_reason)
            VALUES (?, ?, ?, ?, ?)
        `, [itemType, itemId, JSON.stringify(originalData), deletedBy, deletionReason]);

        return result.insertId;
    } catch (error) {
        console.error('Error storing deleted item:', error);
        throw error;
    }
}

// Soft delete an item (mark as deleted without removing from table)
export async function softDeleteItem(tableName, itemId, deletedBy, deletionReason = null) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get the original item data
        const [originalItems] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ?`, [itemId]);
        if (originalItems.length === 0) {
            throw new Error(`Item not found in ${tableName}`);
        }

        const originalData = originalItems[0];

        // Store in deleted_items table
        const itemType = tableName.slice(0, -1); // Remove 's' from table name (products -> product)
        await connection.query(`
            INSERT INTO deleted_items (item_type, item_id, original_data, deleted_by, deletion_reason)
            VALUES (?, ?, ?, ?, ?)
        `, [itemType, itemId, JSON.stringify(originalData), deletedBy, deletionReason]);

        // Mark as deleted in the original table
        await connection.query(`UPDATE ${tableName} SET deleted_at = NOW() WHERE id = ?`, [itemId]);

        await connection.commit();
        return { success: true, originalData };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Get all deleted items with pagination and filtering
export async function getDeletedItems(filters = {}) {
    try {
        let query = `
            SELECT 
                di.*,
                u.username as deleted_by_username
            FROM deleted_items di
            JOIN users u ON di.deleted_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // Apply filters
        if (filters.item_type) {
            query += ` AND di.item_type = ?`;
            params.push(filters.item_type);
        }

        if (filters.deleted_by) {
            query += ` AND di.deleted_by = ?`;
            params.push(filters.deleted_by);
        }

        if (filters.start_date) {
            query += ` AND di.deleted_at >= ?`;
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ` AND di.deleted_at <= ?`;
            params.push(filters.end_date);
        }

        if (filters.can_restore !== undefined) {
            query += ` AND di.can_restore = ?`;
            params.push(filters.can_restore);
        }

        // Search in original data
        if (filters.search) {
            query += ` AND JSON_SEARCH(di.original_data, 'one', ?) IS NOT NULL`;
            params.push(`%${filters.search}%`);
        }

        query += ` ORDER BY di.deleted_at DESC`;

        // Pagination
        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));

            if (filters.offset) {
                query += ` OFFSET ?`;
                params.push(parseInt(filters.offset));
            }
        }

        const [items] = await pool.query(query, params);

        // Parse original_data JSON for each item (only if it's a string)
        return items.map(item => ({
            ...item,
            original_data: typeof item.original_data === 'string' ? JSON.parse(item.original_data) : item.original_data
        }));
    } catch (error) {
        console.error('Error fetching deleted items:', error);
        throw error;
    }
}

// Restore a deleted item
export async function restoreDeletedItem(deletedItemId, restoredBy) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get the deleted item
        const [deletedItems] = await connection.query(`
            SELECT * FROM deleted_items WHERE id = ? AND can_restore = TRUE
        `, [deletedItemId]);

        if (deletedItems.length === 0) {
            throw new Error('Deleted item not found or cannot be restored');
        }

        const deletedItem = deletedItems[0];
        const originalData = typeof deletedItem.original_data === 'string' ? JSON.parse(deletedItem.original_data) : deletedItem.original_data;
        const tableName = deletedItem.item_type + 's'; // Add 's' to make table name

        // Check if item still exists in original table (soft deleted)
        const [existingItems] = await connection.query(`
            SELECT id FROM ${tableName} WHERE id = ? AND deleted_at IS NOT NULL
        `, [deletedItem.item_id]);

        if (existingItems.length > 0) {
            // Item exists but is soft deleted, just restore it
            await connection.query(`
                UPDATE ${tableName} SET deleted_at = NULL WHERE id = ?
            `, [deletedItem.item_id]);
        } else {
            // Item was hard deleted, need to recreate it
            const columns = Object.keys(originalData).join(', ');
            const placeholders = Object.keys(originalData).map(() => '?').join(', ');
            const values = Object.values(originalData);

            await connection.query(`
                INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})
            `, values);
        }

        // Mark the deleted item as restored (can_restore = false)
        await connection.query(`
            UPDATE deleted_items SET can_restore = FALSE WHERE id = ?
        `, [deletedItemId]);

        // Add a restoration log entry
        await connection.query(`
            INSERT INTO deleted_items (item_type, item_id, original_data, deleted_by, deletion_reason, can_restore)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            deletedItem.item_type,
            deletedItem.item_id,
            JSON.stringify({ action: 'restored', restored_at: new Date(), restored_by: restoredBy }),
            restoredBy,
            'Item restored from deleted items',
            false
        ]);

        await connection.commit();
        return { success: true, restoredItem: originalData };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Permanently delete an item (remove from deleted_items table)
export async function permanentlyDeleteItem(deletedItemId) {
    try {
        const [result] = await pool.query(`
            DELETE FROM deleted_items WHERE id = ?
        `, [deletedItemId]);

        if (result.affectedRows === 0) {
            throw new Error('Deleted item not found');
        }

        return { success: true };
    } catch (error) {
        console.error('Error permanently deleting item:', error);
        throw error;
    }
}

// Get deletion statistics
export async function getDeletionStats() {
    try {
        const [stats] = await pool.query(`
            SELECT 
                item_type,
                COUNT(*) as total_deleted,
                SUM(CASE WHEN can_restore = TRUE THEN 1 ELSE 0 END) as can_restore,
                SUM(CASE WHEN can_restore = FALSE THEN 1 ELSE 0 END) as cannot_restore
            FROM deleted_items
            GROUP BY item_type
        `);

        const [totalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_deleted_items,
                SUM(CASE WHEN can_restore = TRUE THEN 1 ELSE 0 END) as total_restorable,
                COUNT(DISTINCT deleted_by) as unique_deleters
            FROM deleted_items
        `);

        return {
            by_type: stats,
            totals: totalStats[0] || { total_deleted_items: 0, total_restorable: 0, unique_deleters: 0 }
        };
    } catch (error) {
        console.error('Error getting deletion statistics:', error);
        throw error;
    }
}