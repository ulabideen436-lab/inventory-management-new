// Test script for discount functionality in sales API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testDiscountAPI() {
  console.log('🧪 Testing Discount Functionality in Sales API\n');
  
  try {
    // Test 1: Create sale with percentage discount
    console.log('📊 Test 1: Creating sale with 10% discount');
    const percentageDiscountSale = {
      customer_id: null, // Walk-in customer
      items: [
        { product_id: 1, name: 'Test Product', price: 100, quantity: 2 }
      ],
      subtotal: 200,
      discount_type: 'percentage',
      discount_value: 10,
      discount_amount: 20,
      total_amount: 180
    };
    
    const response1 = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token' // Replace with actual token
      },
      body: JSON.stringify(percentageDiscountSale)
    });
    
    const result1 = await response1.json();
    console.log('✅ Percentage discount sale result:', result1);
    console.log('');
    
    // Test 2: Create sale with fixed amount discount
    console.log('📊 Test 2: Creating sale with PKR 30 fixed discount');
    const fixedDiscountSale = {
      customer_id: null,
      items: [
        { product_id: 2, name: 'Another Product', price: 150, quantity: 1 }
      ],
      subtotal: 150,
      discount_type: 'amount',
      discount_value: 30,
      discount_amount: 30,
      total_amount: 120
    };
    
    const response2 = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token'
      },
      body: JSON.stringify(fixedDiscountSale)
    });
    
    const result2 = await response2.json();
    console.log('✅ Fixed discount sale result:', result2);
    console.log('');
    
    // Test 3: Create sale without discount
    console.log('📊 Test 3: Creating sale without discount');
    const noDiscountSale = {
      customer_id: null,
      items: [
        { product_id: 3, name: 'Regular Product', price: 75, quantity: 3 }
      ],
      subtotal: 225,
      discount_type: 'none',
      discount_value: 0,
      total_amount: 225
    };
    
    const response3 = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token'
      },
      body: JSON.stringify(noDiscountSale)
    });
    
    const result3 = await response3.json();
    console.log('✅ No discount sale result:', result3);
    console.log('');
    
    // Test 4: Fetch recent sales to verify discount data
    console.log('📊 Test 4: Fetching recent sales to verify discount data');
    const salesResponse = await fetch(`${API_BASE}/sales?limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your-test-token'
      }
    });
    
    const salesData = await salesResponse.json();
    console.log('✅ Recent sales with discount data:');
    salesData.forEach((sale, index) => {
      console.log(`  Sale ${index + 1}:`);
      console.log(`    ID: ${sale.id}`);
      console.log(`    Subtotal: PKR ${sale.subtotal}`);
      console.log(`    Discount Type: ${sale.discount_type}`);
      console.log(`    Discount Amount: PKR ${sale.discount_amount}`);
      console.log(`    Discount Percentage: ${sale.discount_percentage}%`);
      console.log(`    Total: PKR ${sale.total_amount}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDiscountAPI();