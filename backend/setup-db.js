import { pool } from './src/models/db.js';
import bcrypt from 'bcrypt';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create default users
    const ownerPassword = await bcrypt.hash('owner123', 12);
    const cashierPassword = await bcrypt.hash('cashier123', 12);
    
    // Update existing users or insert if they don't exist
    await pool.query(`
      UPDATE users SET password = ? WHERE username = 'owner'
    `, [ownerPassword]);
    
    await pool.query(`
      UPDATE users SET password = ? WHERE username = 'cashier'
    `, [cashierPassword]);
    
    // Insert users if they don't exist
    await pool.query(`
      INSERT IGNORE INTO users (username, password, role) VALUES 
      ('owner', ?, 'owner'),
      ('cashier', ?, 'cashier')
    `, [ownerPassword, cashierPassword]);
    
    console.log('Default users created:');
    console.log('Owner - Username: owner, Password: owner123');
    console.log('Cashier - Username: cashier, Password: cashier123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
