const axios = require('axios');

async function quickTest() {
    try {
        console.log('Testing basic connectivity...');
        const response = await axios.get('http://localhost:5000/health');
        console.log('✅ Backend is reachable');
    } catch (error) {
        console.log('❌ Backend not reachable:', error.message);
        try {
            const response = await axios.get('http://127.0.0.1:5000/health');
            console.log('✅ Backend reachable on 127.0.0.1');
        } catch (error2) {
            console.log('❌ Backend not reachable on 127.0.0.1:', error2.message);
        }
    }

    // Test with simple login
    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        console.log('✅ Login successful, price validation is ready to test');

        // Quick price validation test
        const token = loginResponse.data.token;
        const maliciousSale = {
            customer_type: 'retail',
            items: [{
                product_id: 1,
                quantity: 1,
                price: 1.00  // Obviously wrong price
            }],
            total_amount: 1.00
        };

        try {
            await axios.post('http://localhost:5000/sales', maliciousSale, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('❌ Price validation failed - sale was accepted');
        } catch (validationError) {
            console.log('✅ Price validation working - sale was rejected:');
            console.log('   ', validationError.response?.data?.message || validationError.message);
        }

    } catch (error) {
        console.log('❌ Login failed:', error.message);
    }
}

quickTest();