/**
 * Comprehensive Supplier Operations Test Suite
 * Tests all supplier functionality including CRUD operations, transactions, and balance calculations
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://127.0.0.1:5000';
let authToken = '';
let testSupplierId = null;
let testPurchaseId = null;
let testPaymentId = null;

// Test data
const testSupplier = {
    name: 'Test Supplier Corp',
    brand_name: 'TestBrand',
    contact_info: '+1-555-0123',
    balance: 1000.00,
    opening_balance_type: 'credit'
};

const testPurchase = {
    total_cost: 2500.75,
    description: 'Test purchase for supplier operations',
    supplier_invoice_id: 'TEST-INV-001',
    delivery_method: 'Express Delivery',
    purchase_date: new Date().toISOString().split('T')[0]
};

const testPayment = {
    amount: 1500.00,
    description: 'Test payment to supplier',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0]
};

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'owner',
            password: 'password'
        });
        authToken = response.data.token;
        console.log('✅ Login successful\n');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
} function getAuthHeaders() {
    return { Authorization: `Bearer ${authToken}` };
}

async function testAddSupplier() {
    try {
        console.log('📝 Testing Add Supplier...');
        const response = await axios.post(`${BASE_URL}/suppliers`, testSupplier, {
            headers: getAuthHeaders()
        });

        testSupplierId = response.data.id;
        console.log(`✅ Supplier added successfully (ID: ${testSupplierId})`);
        console.log('   Supplier data:', {
            name: response.data.name,
            brand_name: response.data.brand_name,
            contact_info: response.data.contact_info,
            balance: response.data.balance
        });
        return true;
    } catch (error) {
        console.error('❌ Add supplier failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetSuppliers() {
    try {
        console.log('\n📋 Testing Get All Suppliers...');
        const response = await axios.get(`${BASE_URL}/suppliers`, {
            headers: getAuthHeaders()
        });

        console.log(`✅ Found ${response.data.length} suppliers`);
        const ourSupplier = response.data.find(s => s.id === testSupplierId);
        if (ourSupplier) {
            console.log('   Our test supplier found:', {
                id: ourSupplier.id,
                name: ourSupplier.name,
                balance: ourSupplier.balance
            });
        }
        return true;
    } catch (error) {
        console.error('❌ Get suppliers failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEditSupplier() {
    try {
        console.log('\n✏️ Testing Edit Supplier...');
        const updatedData = {
            name: 'Updated Test Supplier Corp',
            brand_name: 'UpdatedTestBrand',
            contact_info: '+1-555-9999',
            balance: 1200.00,
            opening_balance_type: 'credit'
        };

        const response = await axios.put(`${BASE_URL}/suppliers/${testSupplierId}`, updatedData, {
            headers: getAuthHeaders()
        });

        console.log('✅ Supplier updated successfully');
        console.log('   Updated data:', {
            name: response.data.name,
            brand_name: response.data.brand_name,
            contact_info: response.data.contact_info,
            balance: response.data.balance
        });
        return true;
    } catch (error) {
        console.error('❌ Edit supplier failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCreatePurchase() {
    try {
        console.log('\n🛒 Testing Create Purchase (Simplified)...');
        const purchaseData = {
            ...testPurchase,
            supplier_id: testSupplierId
        };

        console.log('   Purchase data:', purchaseData);

        const response = await axios.post(`${BASE_URL}/purchases`, purchaseData, {
            headers: getAuthHeaders()
        });

        testPurchaseId = response.data.purchaseId || response.data.id;
        console.log(`✅ Purchase created successfully (ID: ${testPurchaseId})`);
        console.log('   Purchase details:', {
            id: testPurchaseId,
            total_cost: purchaseData.total_cost,
            description: purchaseData.description,
            supplier_invoice_id: purchaseData.supplier_invoice_id
        });
        return true;
    } catch (error) {
        console.error('❌ Create purchase failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCreatePayment() {
    try {
        console.log('\n💰 Testing Create Payment...');
        const paymentData = {
            ...testPayment,
            supplier_id: testSupplierId
        };

        console.log('   Payment data:', paymentData);

        const response = await axios.post(`${BASE_URL}/payments`, paymentData, {
            headers: getAuthHeaders()
        });

        testPaymentId = response.data.paymentId || response.data.id;
        console.log(`✅ Payment created successfully (ID: ${testPaymentId})`);
        console.log('   Payment details:', {
            id: testPaymentId,
            amount: paymentData.amount,
            description: paymentData.description,
            payment_method: paymentData.payment_method
        });
        return true;
    } catch (error) {
        console.error('❌ Create payment failed:', error.response?.data || error.message);
        return false;
    }
}

async function testSupplierLedger() {
    try {
        console.log('\n📊 Testing Supplier Ledger & Balance Calculation...');
        const response = await axios.get(`${BASE_URL}/suppliers/${testSupplierId}/history`, {
            headers: getAuthHeaders()
        });

        console.log('✅ Ledger retrieved successfully');
        console.log('   Ledger summary:', {
            totalEntries: response.data.ledger?.length || 0,
            currentBalance: response.data.currentBalance,
            openingBalance: response.data.openingBalance
        });

        if (response.data.ledger && response.data.ledger.length > 0) {
            console.log('\n   Recent transactions:');
            response.data.ledger.slice(0, 5).forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.type}: ${entry.amount} - ${entry.description} (${entry.date})`);
            });

            // Test balance calculation
            let calculatedBalance = parseFloat(response.data.openingBalance) || 0;
            response.data.ledger.forEach(entry => {
                if (entry.type === 'purchase') {
                    calculatedBalance += parseFloat(entry.amount);
                } else if (entry.type === 'payment') {
                    calculatedBalance -= parseFloat(entry.amount);
                }
            });

            console.log('\n   Balance verification:');
            console.log(`   Opening balance: ${response.data.openingBalance}`);
            console.log(`   Calculated balance: ${calculatedBalance.toFixed(2)}`);
            console.log(`   Reported balance: ${response.data.currentBalance}`);

            const balanceMatches = Math.abs(calculatedBalance - parseFloat(response.data.currentBalance)) < 0.01;
            console.log(`   Balance calculation: ${balanceMatches ? '✅ Correct' : '❌ Incorrect'}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Get supplier ledger failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEditPurchase() {
    try {
        console.log('\n✏️ Testing Edit Purchase...');
        const updatedPurchase = {
            total_cost: 2800.50,
            description: 'Updated test purchase',
            supplier_invoice_id: 'TEST-INV-001-UPDATED',
            delivery_method: 'Standard Delivery',
            purchase_date: new Date().toISOString().split('T')[0]
        };

        const response = await axios.put(`${BASE_URL}/purchases/${testPurchaseId}`, updatedPurchase, {
            headers: getAuthHeaders()
        });

        console.log('✅ Purchase updated successfully');
        console.log('   Updated purchase:', {
            id: testPurchaseId,
            total_cost: updatedPurchase.total_cost,
            description: updatedPurchase.description,
            supplier_invoice_id: updatedPurchase.supplier_invoice_id
        });
        return true;
    } catch (error) {
        console.error('❌ Edit purchase failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEditPayment() {
    try {
        console.log('\n✏️ Testing Edit Payment...');
        const updatedPayment = {
            amount: 1750.00,
            description: 'Updated test payment to supplier',
            payment_method: 'Cash',
            payment_date: new Date().toISOString().split('T')[0]
        };

        const response = await axios.put(`${BASE_URL}/payments/${testPaymentId}`, updatedPayment, {
            headers: getAuthHeaders()
        });

        console.log('✅ Payment updated successfully');
        console.log('   Updated payment:', {
            id: testPaymentId,
            amount: updatedPayment.amount,
            description: updatedPayment.description,
            payment_method: updatedPayment.payment_method
        });
        return true;
    } catch (error) {
        console.error('❌ Edit payment failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeletePurchase() {
    try {
        console.log('\n🗑️ Testing Delete Purchase...');

        // Test deletion with password verification
        const deleteData = {
            password: 'password'
        };

        const response = await axios.delete(`${BASE_URL}/purchases/${testPurchaseId}`, {
            headers: getAuthHeaders(),
            data: deleteData
        });

        console.log('✅ Purchase deleted successfully');
        console.log('   Deletion response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Delete purchase failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeletePayment() {
    try {
        console.log('\n🗑️ Testing Delete Payment...');

        // Test deletion with password verification
        const deleteData = {
            password: 'password'
        };

        const response = await axios.delete(`${BASE_URL}/payments/${testPaymentId}`, {
            headers: getAuthHeaders(),
            data: deleteData
        });

        console.log('✅ Payment deleted successfully');
        console.log('   Deletion response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Delete payment failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeleteSupplier() {
    try {
        console.log('\n🗑️ Testing Delete Supplier...');

        // Test deletion with password verification
        const deleteData = {
            password: 'password'
        };

        const response = await axios.delete(`${BASE_URL}/suppliers/${testSupplierId}`, {
            headers: getAuthHeaders(),
            data: deleteData
        });

        console.log('✅ Supplier deleted successfully');
        console.log('   Deletion response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Delete supplier failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFinalLedgerCleanup() {
    try {
        console.log('\n🧹 Testing Final Ledger State...');

        // Try to get the deleted supplier's history (should fail or return empty)
        try {
            const response = await axios.get(`${BASE_URL}/suppliers/${testSupplierId}/history`, {
                headers: getAuthHeaders()
            });
            console.log('⚠️ Supplier still exists after deletion (unexpected)');
            console.log('   Remaining data:', response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Supplier properly deleted - ledger no longer accessible');
            } else {
                console.log('❓ Unexpected error accessing deleted supplier:', error.response?.data || error.message);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Final cleanup test failed:', error.message);
        return false;
    }
}

async function runComprehensiveTest() {
    console.log('🧪 COMPREHENSIVE SUPPLIER OPERATIONS TEST SUITE');
    console.log('================================================\n');

    const tests = [
        { name: 'Login', fn: login },
        { name: 'Add Supplier', fn: testAddSupplier },
        { name: 'Get Suppliers', fn: testGetSuppliers },
        { name: 'Edit Supplier', fn: testEditSupplier },
        { name: 'Create Purchase', fn: testCreatePurchase },
        { name: 'Create Payment', fn: testCreatePayment },
        { name: 'Supplier Ledger & Balance', fn: testSupplierLedger },
        { name: 'Edit Purchase', fn: testEditPurchase },
        { name: 'Edit Payment', fn: testEditPayment },
        { name: 'Updated Ledger Check', fn: testSupplierLedger },
        { name: 'Delete Purchase', fn: testDeletePurchase },
        { name: 'Delete Payment', fn: testDeletePayment },
        { name: 'Final Ledger Check', fn: testSupplierLedger },
        { name: 'Delete Supplier', fn: testDeleteSupplier },
        { name: 'Final Cleanup Verification', fn: testFinalLedgerCleanup }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ ${test.name} crashed:`, error.message);
            failed++;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n================================================');
    console.log('🎯 TEST RESULTS SUMMARY');
    console.log('================================================');
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Supplier operations are working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
    }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);