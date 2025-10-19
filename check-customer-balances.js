import axios from 'axios';

async function checkBalances() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Get customers
        const res = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const customers = res.data;

        console.log('Total customers:', customers.length);
        console.log('\n=== Sample Customers ===');
        customers.slice(0, 5).forEach(c => {
            console.log(`${c.name}: Balance=${c.balance}, Type=${c.balance_type || 'N/A'}`);
        });

        const withType = customers.filter(c => c.balance_type);
        const drCustomers = customers.filter(c => c.balance_type === 'Dr');
        const crCustomers = customers.filter(c => c.balance_type === 'Cr');

        console.log('\n=== Balance Type Distribution ===');
        console.log(`With balance_type field: ${withType.length}`);
        console.log(`Dr (Debit) customers: ${drCustomers.length}`);
        console.log(`Cr (Credit) customers: ${crCustomers.length}`);

        console.log('\n=== Dr (Debit) Customers ===');
        drCustomers.slice(0, 10).forEach(c => {
            console.log(`- ${c.name}: ${c.balance} Dr`);
        });

        console.log('\n=== Cr (Credit) Customers ===');
        crCustomers.slice(0, 10).forEach(c => {
            console.log(`- ${c.name}: ${c.balance} Cr`);
        });

        // Check the specific customer from screenshot
        const zain = customers.find(c => c.name.includes('Zain'));
        if (zain) {
            console.log('\n=== Zain Ul Abideen ===');
            console.log(`Name: ${zain.name}`);
            console.log(`Balance: ${zain.balance}`);
            console.log(`Balance Type: ${zain.balance_type}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBalances();
