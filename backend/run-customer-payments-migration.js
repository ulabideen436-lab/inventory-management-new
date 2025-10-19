// Run customer payments table migration
import fs from 'fs';
import { pool } from './src/models/db.js';

async function runMigration() {
    try {
        const migrationSQL = fs.readFileSync('../db/migrations/2025-10-01-create-customer-payments-table.sql', 'utf8');

        // Split by semicolon to handle multiple statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await pool.query(statement);
                console.log('✅ Statement executed successfully');
            }
        }

        console.log('🎉 Customer payments table migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();