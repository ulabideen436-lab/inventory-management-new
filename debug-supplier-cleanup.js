import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'admin123';

async function debugSupplierCleanup() {
    try {
        // Login
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: OWNER_PASSWORD
        });
        const authToken = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get deleted items to find a supplier
        const deletedItemsResponse = await axios.get(`${BASE_URL}/deleted-items?item_type=supplier`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const deletedSuppliers = deletedItemsResponse.data.filter(item => item.can_restore);
        console.log(`Found ${deletedSuppliers.length} restorable suppliers`);

        if (deletedSuppliers.length === 0) {
            console.log('No restorable suppliers found for testing');
            return;
        }

        const testSupplier = deletedSuppliers[0];
        console.log(`Testing with supplier ID: ${testSupplier.item_id}, deleted item ID: ${testSupplier.id}`);

        // Step 1: Try to restore the supplier
        console.log('\n🔄 Step 1: Restoring supplier...');
        try {
            const restoreResponse = await axios.post(`${BASE_URL}/deleted-items/${testSupplier.id}/restore`,
                { password: OWNER_PASSWORD },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log('✅ Supplier restored successfully');
        } catch (error) {
            console.error('❌ Restore failed:', error.response?.data || error.message);
            return;
        }

        // Step 2: Check if supplier is back in suppliers list
        console.log('\n📋 Step 2: Verifying supplier is restored...');
        const suppliersResponse = await axios.get(`${BASE_URL}/suppliers`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const restoredSupplier = suppliersResponse.data.find(s => s.id == testSupplier.item_id);
        console.log(`✅ Supplier found in list: ${restoredSupplier ? 'YES' : 'NO'}`);

        if (restoredSupplier) {
            console.log(`   - Name: ${restoredSupplier.name}`);
            console.log(`   - Balance: ${restoredSupplier.balance}`);
        }

        // Step 3: Check for associated data
        console.log('\n🔍 Step 3: Checking for associated data...');
        try {
            const purchasesResponse = await axios.get(`${BASE_URL}/purchases`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const relatedPurchases = purchasesResponse.data.filter(p => p.supplier_id == testSupplier.item_id);
            console.log(`   - Related purchases: ${relatedPurchases.length}`);

            // Check payments table directly via a custom query or API if available
            console.log(`   - Supplier ID in question: ${testSupplier.item_id}`);
        } catch (error) {
            console.log('   - Could not check purchases');
        }

        // Step 4: Try to delete the supplier
        console.log('\n🗑️ Step 4: Attempting to delete supplier...');
        try {
            const deleteResponse = await axios.delete(`${BASE_URL}/suppliers/${testSupplier.item_id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { password: OWNER_PASSWORD }
            });
            console.log('✅ Supplier deleted successfully');
        } catch (error) {
            console.error('❌ Delete failed:', error.response?.status, error.response?.data || error.message);

            if (error.response?.data?.hasAssociatedData) {
                console.log(`   - Reason: ${error.response.data.message}`);
                console.log(`   - Associated records: ${error.response.data.associatedRecords}`);
                console.log(`   - Data type: ${error.response.data.dataType}`);
            }
        }

    } catch (error) {
        console.error('❌ Test error:', error.response?.data || error.message);
    }
}

debugSupplierCleanup();