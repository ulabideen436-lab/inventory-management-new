import mysql from 'mysql2/promise';

async function migrateSaleItemsForDirectStorage() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('Starting sale_items table migration...');

        // Step 1: Add new columns for product details
        console.log('1. Adding product detail columns...');
        await conn.query(`
      ALTER TABLE sale_items 
      ADD COLUMN product_name VARCHAR(100) NULL AFTER product_id,
      ADD COLUMN product_brand VARCHAR(100) NULL AFTER product_name,
      ADD COLUMN product_category VARCHAR(100) NULL AFTER product_brand,
      ADD COLUMN product_uom VARCHAR(20) NULL AFTER product_category
    `);

        // Step 2: Populate new columns with existing product data
        console.log('2. Populating product details from products table...');
        await conn.query(`
      UPDATE sale_items si 
      JOIN products p ON si.product_id = p.id 
      SET 
        si.product_name = p.name,
        si.product_brand = p.brand,
        si.product_category = p.category,
        si.product_uom = p.uom
    `);

        // Step 3: Drop the foreign key constraint
        console.log('3. Dropping foreign key constraint...');
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
        }

        // Step 4: Make product_id nullable since we won't always need it
        console.log('4. Making product_id nullable...');
        await conn.query(`ALTER TABLE sale_items MODIFY product_id VARCHAR(12) NULL`);

        console.log('Migration completed successfully!');
        console.log('');
        console.log('New sale_items table structure:');
        const [newStructure] = await conn.query('DESCRIBE sale_items');
        console.table(newStructure);

        await conn.end();
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrateSaleItemsForDirectStorage();