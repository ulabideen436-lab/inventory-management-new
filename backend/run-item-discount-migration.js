import fs from 'fs';
import { pool } from './src/models/db.js';

async function runItemDiscountMigration() {
    try {
        console.log('🔄 Running item discount fields migration...');

        const migrationSQL = fs.readFileSync('../db/migrations/2025-09-30-add-item-discount-columns.sql', 'utf8');

        // Split the SQL into individual statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.trim().substring(0, 50) + '...');
            await pool.query(statement.trim());
        }

        console.log('✅ Item discount migration completed successfully!');
        console.log('📋 Added fields to sale_items table:');
        console.log('   - item_discount_type (enum: none, percentage, amount)');
        console.log('   - item_discount_value (decimal: input value)');
        console.log('   - item_discount_amount (decimal: calculated discount)');
        console.log('   - original_price (decimal: price before discount)');
        console.log('   - final_price (decimal: price after discount)');

    } catch (error) {
        console.error('❌ Item discount migration failed:', error.message);
    } finally {
        process.exit();
    }
}

runItemDiscountMigration();