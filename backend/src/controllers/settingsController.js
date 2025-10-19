import fs from 'fs';
import path from 'path';
import { pool } from '../models/db.js';

// Get system settings
export async function getSettings(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const [settings] = await pool.query(`
      SELECT setting_key, setting_value 
      FROM system_settings
    `);

        // Convert array to object
        const settingsObject = {};
        settings.forEach(setting => {
            settingsObject[setting.setting_key] = setting.setting_value;
        });

        res.json(settingsObject);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update system settings
export async function updateSettings(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const settings = req.body;

        // Create system_settings table if it doesn't exist
        await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = ?
      `, [key, value, value]);
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Export data
export async function exportData(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        // Fetch all data
        const [products] = await pool.query('SELECT * FROM products ORDER BY id');
        const [customers] = await pool.query('SELECT * FROM customers ORDER BY id');
        const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY id');
        const [sales] = await pool.query('SELECT * FROM sales ORDER BY id DESC LIMIT 1000'); // Last 1000 sales
        const [saleItems] = await pool.query(`
      SELECT si.* FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ORDER BY s.id DESC LIMIT 5000
    `); // Sale items for exported sales
        const [users] = await pool.query('SELECT id, username, email, full_name, role, created_at FROM users');
        const [settings] = await pool.query('SELECT * FROM system_settings');

        const exportData = {
            export_date: new Date().toISOString(),
            version: '1.0',
            data: {
                products,
                customers,
                suppliers,
                sales,
                sale_items: saleItems,
                users,
                settings
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=storeflow-export-${new Date().toISOString().split('T')[0]}.json`);
        res.json(exportData);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create database backup
export async function createBackup(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        // This is a simplified backup - in production you'd use mysqldump
        const backupData = {
            backup_date: new Date().toISOString(),
            type: 'database_backup',
            message: 'Database backup feature would require mysqldump integration in production'
        };

        // Create backups directory if it doesn't exist
        const backupsDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Save backup info
        const backupFile = path.join(backupsDir, `backup-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

        res.json({
            message: 'Backup created successfully',
            backup_file: backupFile,
            note: 'This is a simplified backup. Production systems should use proper database backup tools.'
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get system statistics
export async function getSystemStats(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        // Get various system statistics
        const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        const [customerCount] = await pool.query('SELECT COUNT(*) as count FROM customers');
        const [supplierCount] = await pool.query('SELECT COUNT(*) as count FROM suppliers');
        const [salesCount] = await pool.query('SELECT COUNT(*) as count FROM sales');
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');

        const [lowStockProducts] = await pool.query(`
      SELECT COUNT(*) as count FROM products 
      WHERE stock_quantity <= 10
    `);

        const [totalRevenue] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM sales 
      WHERE status = 'completed'
      AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

        const stats = {
            products: productCount[0].count,
            customers: customerCount[0].count,
            suppliers: supplierCount[0].count,
            sales: salesCount[0].count,
            users: userCount[0].count,
            low_stock_products: lowStockProducts[0].count,
            monthly_revenue: totalRevenue[0].total,
            last_updated: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}