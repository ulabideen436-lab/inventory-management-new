import mysql from 'mysql2/promise';

async function completeSaleItemsMigration() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('Completing sale_items table migration...');

        // Step 1: Populate new columns with existing product data
        console.log('1. Populating product details from products table...');
        await conn.query(`
      UPDATE sale_items si 
      JOIN products p ON si.product_id = p.id 
      SET 
        si.product_name = p.name,
        si.product_brand = p.brand,
        si.product_category = p.category,
        si.product_uom = p.uom
    `);

        // Step 2: Drop the foreign key constraint
        console.log('2. Dropping foreign key constraint...');
        // First, find the foreign key name
        const [fks] = await conn.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'storeflow' 
      AND TABLE_NAME = 'sale_items' 
      AND COLUMN_NAME = 'product_id' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

        if (fks.length > 0) {
            const fkName = fks[0].CONSTRAINT_NAME;
            await conn.query(`ALTER TABLE sale_items DROP FOREIGN KEY ${fkName}`);
            console.log(`   - Dropped foreign key: ${fkName}`);
        } else {
            console.log('   - No foreign key constraint found');
        }

        // Step 3: Make product_id nullable since we won't always need it
        console.log('3. Making product_id nullable...');
        await conn.query(`ALTER TABLE sale_items MODIFY product_id VARCHAR(12) NULL`);

        console.log('Migration completed successfully!');
        console.log('');
        console.log('Final sale_items table structure:');
        const [newStructure] = await conn.query('DESCRIBE sale_items');
        console.table(newStructure);

        // Check data
        console.log('');
        console.log('Sample data with product details:');
        const [sampleData] = await conn.query(`
      SELECT id, product_id, product_name, product_brand, product_category, product_uom, quantity, price 
      FROM sale_items 
      LIMIT 5
    `);
        console.table(sampleData);

        await conn.end();
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

completeSaleItemsMigration();