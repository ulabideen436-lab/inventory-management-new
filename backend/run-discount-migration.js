import { pool } from './src/models/db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('🔄 Running discount fields migration...');
    
    const migrationSQL = fs.readFileSync('../db/migrations/2025-09-30-add-sales-discount-columns.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement.trim().substring(0, 50) + '...');
      await pool.query(statement.trim());
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added fields: discount_amount, discount_percentage, subtotal, discount_type to sales table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit();
  }
}

runMigration();