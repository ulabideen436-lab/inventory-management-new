import mysql from 'mysql2/promise';

async function checkDatabaseStructure() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔍 CHECKING DATABASE STRUCTURE');
        console.log('===============================');

        // Check products table structure
        const [productsStructure] = await connection.query('DESCRIBE products');
        console.log('\n📦 PRODUCTS TABLE STRUCTURE:');
        productsStructure.forEach(row => {
            console.log(`   ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'} ${row.Key ? `[${row.Key}]` : ''}`);
        });

        // Check customers table structure
        const [customersStructure] = await connection.query('DESCRIBE customers');
        console.log('\n👥 CUSTOMERS TABLE STRUCTURE:');
        customersStructure.forEach(row => {
            console.log(`   ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'} ${row.Key ? `[${row.Key}]` : ''}`);
        });

        // Check deleted_items table
        try {
            const [deletedItemsStructure] = await connection.query('DESCRIBE deleted_items');
            console.log('\n🗑️ DELETED_ITEMS TABLE STRUCTURE:');
            deletedItemsStructure.forEach(row => {
                console.log(`   ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'} ${row.Key ? `[${row.Key}]` : ''}`);
            });
        } catch (error) {
            console.log('\n❌ DELETED_ITEMS TABLE: Does not exist');
            console.log('   This might be causing the deletion issues!');
        }

        // Check if products have deleted_at column
        const hasDeletedAt = productsStructure.some(row => row.Field === 'deleted_at');
        console.log(`\n🏷️ Products table has deleted_at column: ${hasDeletedAt ? '✅ YES' : '❌ NO'}`);

        // Check if customers have deleted_at column
        const customersHasDeletedAt = customersStructure.some(row => row.Field === 'deleted_at');
        console.log(`🏷️ Customers table has deleted_at column: ${customersHasDeletedAt ? '✅ YES' : '❌ NO'}`);

        await connection.end();

    } catch (error) {
        console.error('Database check error:', error.message);
    }
}

checkDatabaseStructure();