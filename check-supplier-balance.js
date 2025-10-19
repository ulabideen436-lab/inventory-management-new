import axios from 'axios';

async function checkSupplierBalance() {
    try {
        console.log('Checking Supplier Balance in Database vs API...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Get supplier from suppliers list
        console.log('1. Getting supplier from /suppliers endpoint...');
        const suppliersRes = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const supplier18 = suppliersRes.data.find(s => s.id === 18);
        console.log(`   Supplier ID 18 balance: ${supplier18.balance}`);
        console.log(`   ❌ THIS IS WRONG - should be 1500.75\n`);

        // Get supplier history which recalculates
        console.log('2. Getting supplier history (forces recalculation)...');
        const historyRes = await axios.get('http://localhost:5000/suppliers/18/history', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`   Calculated balance: ${historyRes.data.supplier.balance}`);
        console.log(`   ✅ THIS IS CORRECT - 1500.75\n`);

        // Get supplier again to see if it updated
        console.log('3. Getting supplier from /suppliers endpoint AGAIN...');
        const suppliersRes2 = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const supplier18Again = suppliersRes2.data.find(s => s.id === 18);
        console.log(`   Supplier ID 18 balance: ${supplier18Again.balance}`);

        if (supplier18Again.balance === 1500.75) {
            console.log(`   ✅ Balance is NOW CORRECT!\n`);
        } else {
            console.log(`   ❌ Balance is STILL WRONG!\n`);
            console.log('   The getSuppliers endpoint is using cached/old data');
            console.log('   or not recalculating the closing balance properly.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSupplierBalance();