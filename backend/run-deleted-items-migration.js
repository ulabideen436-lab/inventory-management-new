import fs from 'fs';
import { pool } from './src/models/db.js';

async function runMigration() {
    try {
        const sql = fs.readFileSync('./create-deleted-items-table.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 80) + '...');
            await pool.query(statement);
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();