import mysql from 'mysql2/promise';

async function checkCustomersTable() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('=== Customers Table Structure ===');
        const [rows] = await conn.query('DESCRIBE customers');
        console.table(rows);

        console.log('\n=== Checking opening_balance_type column specifically ===');
        const balanceTypeColumn = rows.find(row => row.Field === 'opening_balance_type');
        if (balanceTypeColumn) {
            console.log('Column details:', balanceTypeColumn);
        } else {
            console.log('opening_balance_type column not found!');
        }

        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkCustomersTable();