import mysql from 'mysql2/promise';

async function checkPaymentsTableStructure() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'inventory_management',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Checking payments table structure...\n');

        // Show table structure
        const [columns] = await pool.query('DESCRIBE payments');
        console.log('Payments table columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // Show sample data
        console.log('\nSample payment records:');
        const [payments] = await pool.query('SELECT * FROM payments LIMIT 3');
        console.log(JSON.stringify(payments, null, 2));

        await pool.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPaymentsTableStructure();