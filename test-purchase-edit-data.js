import axios from 'axios';

async function testPurchaseEditData() {
    try {
        console.log('Testing Purchase Edit Data Retrieval...\n');

        // Login first - try different credentials
        let loginRes;
        const credentials = [
            { username: 'owner', password: 'password' },
            { username: 'owner', password: 'admin123' },
            { username: 'owner', password: 'owner123' }
        ];

        for (const creds of credentials) {
            try {
                loginRes = await axios.post('http://localhost:5000/auth/login', creds);
                console.log(`✓ Logged in with: ${creds.username}/${creds.password}\n`);
                break;
            } catch (err) {
                continue;
            }
        }

        if (!loginRes) {
            console.log('❌ Could not login with any credentials');
            return;
        } const token = loginRes.data.token;
        console.log('✓ Logged in successfully\n');

        // Get all purchases
        const purchasesRes = await axios.get('http://localhost:5000/purchases', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (purchasesRes.data.length === 0) {
            console.log('⚠ No purchases found in database');
            return;
        }

        // Get the first purchase details
        const firstPurchase = purchasesRes.data[0];
        console.log(`Testing with Purchase ID: ${firstPurchase.id}\n`);

        const purchaseRes = await axios.get(`http://localhost:5000/purchases/${firstPurchase.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const purchase = purchaseRes.data;

        console.log('Purchase Data Retrieved:');
        console.log('========================');
        console.log(`ID: ${purchase.id}`);
        console.log(`Supplier ID: ${purchase.supplier_id}`);
        console.log(`Total Cost: PKR ${purchase.total_cost}`);
        console.log(`Date: ${purchase.date}`);
        console.log(`Description: ${purchase.description || '(empty)'}`);
        console.log(`Supplier Invoice ID: ${purchase.supplier_invoice_id || '(empty)'}`);
        console.log(`Delivery Method: ${purchase.delivery_method || '(empty)'}`);
        console.log(`Items Count: ${purchase.items ? purchase.items.length : 0}`);
        console.log('========================\n');

        // Verify all required fields are present
        const requiredFields = ['id', 'supplier_id', 'total_cost', 'date', 'description', 'supplier_invoice_id', 'delivery_method'];
        const missingFields = requiredFields.filter(field => !(field in purchase));

        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields.join(', '));
        } else {
            console.log('✓ All required fields are present!');
        }

        // Test if date can be used in date input
        if (purchase.date) {
            try {
                const dateStr = new Date(purchase.date).toISOString().split('T')[0];
                console.log(`✓ Date can be formatted for input: ${dateStr}`);
            } catch (err) {
                console.log('❌ Date formatting failed:', err.message);
            }
        }

    } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

testPurchaseEditData();
