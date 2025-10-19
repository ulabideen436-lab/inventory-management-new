import axios from 'axios';

async function testSupplierHistoryColumns() {
    try {
        console.log('Testing Supplier History with All Columns...\n');

        // Login first
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
        }

        const token = loginRes.data.token;

        // Get suppliers
        const suppliersRes = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (suppliersRes.data.length === 0) {
            console.log('⚠ No suppliers found');
            return;
        }

        // Get history for first supplier with balance > 0
        const supplier = suppliersRes.data.find(s => s.balance > 0) || suppliersRes.data[0];
        console.log(`Testing with Supplier: ${supplier.name} (ID: ${supplier.id})\n`);

        const historyRes = await axios.get(`http://localhost:5000/suppliers/${supplier.id}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { ledger, supplier: supplierInfo } = historyRes.data;

        console.log('Supplier Information:');
        console.log('====================');
        console.log(`Name: ${supplierInfo.name}`);
        console.log(`Brand: ${supplierInfo.brand_name || 'N/A'}`);
        console.log(`Opening Balance: PKR ${supplierInfo.opening_balance}`);
        console.log(`Current Balance: PKR ${supplierInfo.balance}`);
        console.log(`\nTotal Ledger Entries: ${ledger.length}\n`);

        // Display ledger with all columns
        console.log('Ledger Entries (All Columns):');
        console.log('='.repeat(120));
        console.log(
            'Date'.padEnd(12) +
            'Trans#'.padEnd(8) +
            'DOC'.padEnd(6) +
            'Description'.padEnd(35) +
            'Invoice/Ref#'.padEnd(15) +
            'Method'.padEnd(12) +
            'Debit'.padStart(10) +
            'Credit'.padStart(10) +
            'Balance'.padStart(12)
        );
        console.log('='.repeat(120));

        ledger.forEach(record => {
            const date = record.type === 'opening' ? '-' : new Date(record.date).toLocaleDateString();
            const transNo = record.id || '-';
            const doc = record.doc_type || '-';
            const desc = (record.description || '').substring(0, 33);
            const invoiceRef = record.type === 'purchase'
                ? (record.supplier_invoice_id || '-')
                : record.type === 'payment'
                    ? (record.reference_number || '-')
                    : '-';
            const method = record.type === 'purchase'
                ? (record.delivery_method || '-')
                : record.type === 'payment'
                    ? (record.payment_method || '-')
                    : '-';
            const debit = record.debit > 0 ? record.debit.toFixed(2) : '-';
            const credit = record.credit > 0 ? record.credit.toFixed(2) : '-';
            const balance = `${Math.abs(record.running_balance).toFixed(2)} ${record.running_balance >= 0 ? 'Dr' : 'Cr'}`;

            console.log(
                date.padEnd(12) +
                String(transNo).padEnd(8) +
                doc.padEnd(6) +
                desc.padEnd(35) +
                invoiceRef.substring(0, 13).padEnd(15) +
                method.substring(0, 10).padEnd(12) +
                String(debit).padStart(10) +
                String(credit).padStart(10) +
                balance.padStart(12)
            );
        });

        console.log('='.repeat(120));

        // Check for purchases with details
        const purchases = ledger.filter(r => r.type === 'purchase');
        const payments = ledger.filter(r => r.type === 'payment');

        console.log('\nPurchases Details:');
        console.log('==================');
        purchases.forEach(p => {
            console.log(`\nPurchase #${p.id}:`);
            console.log(`  Description: ${p.description || 'N/A'}`);
            console.log(`  Invoice ID: ${p.supplier_invoice_id || 'N/A'}`);
            console.log(`  Delivery Method: ${p.delivery_method || 'N/A'}`);
            console.log(`  Amount: PKR ${p.amount}`);
            console.log(`  Date: ${new Date(p.date).toLocaleDateString()}`);
        });

        console.log('\n\nPayments Details:');
        console.log('=================');
        payments.forEach(p => {
            console.log(`\nPayment #${p.id}:`);
            console.log(`  Description: ${p.description}`);
            console.log(`  Reference#: ${p.reference_number || 'N/A'}`);
            console.log(`  Payment Method: ${p.payment_method || 'N/A'}`);
            console.log(`  Amount: PKR ${p.amount}`);
            console.log(`  Date: ${new Date(p.date).toLocaleDateString()}`);
        });

        console.log('\n✓ All column data retrieved successfully!');

    } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

testSupplierHistoryColumns();
