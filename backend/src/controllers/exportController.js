
import { pool } from '../models/db.js';

/**
 * Export data from the database
 * Exports users, products, customers, suppliers, sales, and system settings
 */
export const exportData = async (req, res) => {
    try {
        console.log('📤 Starting data export...');

        // Get current timestamp for the export
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Export all relevant data
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                exportedBy: req.user.userId
            },
            users: [],
            customers: [],
            suppliers: [],
            products: [],
            sales: [],
            systemSettings: []
        };

        // Export users (excluding passwords)
        try {
            const [users] = await pool.query(
                'SELECT id, username, role, email, full_name, active, created_at FROM users ORDER BY id'
            );
            exportData.users = users;
            console.log(`📤 Exported ${users.length} users`);
        } catch (err) {
            console.warn('⚠️ Could not export users:', err.message);
        }        // Export customers
        try {
            const [customers] = await pool.query(
                'SELECT * FROM customers ORDER BY id'
            );
            exportData.customers = customers;
            console.log(`📤 Exported ${customers.length} customers`);
        } catch (err) {
            console.warn('⚠️ Could not export customers:', err.message);
        }

        // Export suppliers
        try {
            const [suppliers] = await pool.query(
                'SELECT * FROM suppliers ORDER BY id'
            );
            exportData.suppliers = suppliers;
            console.log(`📤 Exported ${suppliers.length} suppliers`);
        } catch (err) {
            console.warn('⚠️ Could not export suppliers:', err.message);
        }

        // Export products
        try {
            const [products] = await pool.query(
                'SELECT * FROM products ORDER BY id'
            );
            exportData.products = products;
            console.log(`📤 Exported ${products.length} products`);
        } catch (err) {
            console.warn('⚠️ Could not export products:', err.message);
        }

        // Export sales (basic info only, not full details)
        try {
            const [sales] = await pool.query(
                'SELECT id, customer_id, total_amount, discount_amount, sale_date, status FROM sales ORDER BY id LIMIT 1000'
            );
            exportData.sales = sales;
            console.log(`📤 Exported ${sales.length} sales records`);
        } catch (err) {
            console.warn('⚠️ Could not export sales:', err.message);
        }

        // Export system settings
        try {
            const [settings] = await pool.query(
                'SELECT * FROM system_settings ORDER BY setting_key'
            );
            exportData.systemSettings = settings;
            console.log(`📤 Exported ${settings.length} system settings`);
        } catch (err) {
            console.warn('⚠️ Could not export system settings:', err.message);
        }

        // Set appropriate headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="inventory_export_${timestamp}.json"`);

        console.log('✅ Data export completed successfully');
        res.status(200).json(exportData);

    } catch (error) {
        console.error('❌ Export failed:', error);
        res.status(500).json({
            error: 'Export failed',
            message: error.message
        });
    }
};

/**
 * Create a database backup
 * Creates a SQL dump of the database structure and data
 */
export const backupDatabase = async (req, res) => {
    try {
        console.log('💾 Starting database backup...');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Get database connection info
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'inventory_management',
            user: process.env.DB_USER || 'root'
        };

        // For a simple backup, we'll export the schema and data as JSON
        // In a production environment, you might use mysqldump or similar tools

        const backupData = {
            metadata: {
                backupDate: new Date().toISOString(),
                database: dbConfig.database,
                version: '1.0.0',
                backedUpBy: req.user.userId
            },
            tables: {}
        };

        // List of tables to backup
        const tables = [
            'users', 'customers', 'suppliers', 'products', 'categories',
            'sales', 'sale_items', 'purchases', 'purchase_items',
            'customer_payments', 'supplier_payments', 'system_settings'
        ];

        for (const table of tables) {
            try {
                // Get table structure
                const [structure] = await pool.query(`DESCRIBE ${table}`);

                // Get table data
                const [data] = await pool.query(`SELECT * FROM ${table}`);

                backupData.tables[table] = {
                    structure: structure,
                    data: data,
                    recordCount: data.length
                };

                console.log(`💾 Backed up table ${table}: ${data.length} records`);
            } catch (err) {
                console.warn(`⚠️ Could not backup table ${table}:`, err.message);
                backupData.tables[table] = {
                    error: err.message
                };
            }
        }

        // Set appropriate headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="inventory_backup_${timestamp}.json"`);

        console.log('✅ Database backup completed successfully');
        res.status(200).json(backupData);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        res.status(500).json({
            error: 'Backup failed',
            message: error.message
        });
    }
};

/**
 * Get backup/export status and available files
 */
export const getBackupStatus = async (req, res) => {
    try {
        const status = {
            serverTime: new Date().toISOString(),
            backupEnabled: true,
            exportEnabled: true,
            lastBackup: null, // Would be stored in database in real implementation
            availableBackups: [] // Would list actual backup files in real implementation
        };

        res.status(200).json(status);
    } catch (error) {
        console.error('❌ Failed to get backup status:', error);
        res.status(500).json({
            error: 'Failed to get backup status',
            message: error.message
        });
    }
};