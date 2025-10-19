import { pool } from './src/models/db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Running migration: Add opening balance type field...');
    
    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync('../db/migrations/2025-09-21-add-opening-balance-type.sql', 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await pool.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Added opening_balance_type field to customers table');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    process.exit();
  }
}

runMigration();