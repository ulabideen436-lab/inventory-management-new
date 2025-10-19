const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runDiscountMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your MySQL password
      database: 'storeflow'
    });

    console.log('Connected to database...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db', 'migrations', '2025-09-30-add-sales-discount-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements (handle multiple statements)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Running ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Sales discount columns migration completed successfully!');
    console.log('');
    console.log('New columns added to sales table:');
    console.log('- discount_amount: Fixed discount amount in PKR');
    console.log('- discount_percentage: Percentage discount (0-100)');
    console.log('- subtotal: Subtotal before discount');
    console.log('- discount_type: Type of discount applied (none/amount/percentage)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
runDiscountMigration();