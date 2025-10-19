const mysql = require('mysql2/promise');

async function createSystemSettingsTable() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔧 Creating system_settings table...');

        // Create system_settings table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ system_settings table created successfully');

        // Insert default settings
        const defaultSettings = [
            ['business_name', 'StoreFlow Management System', 'Name of the business'],
            ['business_address', '', 'Business address'],
            ['business_phone', '', 'Business phone number'],
            ['business_email', '', 'Business email address'],
            ['tax_rate', '0.00', 'Default tax rate percentage'],
            ['currency', 'PKR', 'Default currency'],
            ['low_stock_threshold', '10', 'Low stock alert threshold'],
            ['backup_frequency', 'daily', 'Backup frequency setting']
        ];

        console.log('📝 Inserting default settings...');

        for (const [key, value, description] of defaultSettings) {
            try {
                await conn.query(`
                    INSERT INTO system_settings (setting_key, setting_value, description)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    description = VALUES(description),
                    updated_at = CURRENT_TIMESTAMP
                `, [key, value, description]);

                console.log(`   ✅ ${key}: ${value}`);
            } catch (err) {
                console.log(`   ⚠️ ${key}: Already exists or error`);
            }
        }

        // Show final table structure and content
        console.log('\n📊 Final system_settings table:');
        const [structure] = await conn.query('DESCRIBE system_settings');
        console.table(structure);

        console.log('\n📋 Current settings:');
        const [settings] = await conn.query('SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key');
        console.table(settings);

        await conn.end();
        console.log('\n🎉 System settings table setup complete!');

    } catch (error) {
        console.error('❌ Error setting up system_settings table:', error.message);
    }
}

createSystemSettingsTable();