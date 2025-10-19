const axios = require('axios');

async function testPaymentCreation() {
    try {
        console.log('🧪 Testing Payment Creation...');

        // Login first
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'password'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Create payment
        const paymentData = {
            supplier_id: 3, // Use existing supplier
            amount: 100,
            description: 'Test payment',
            payment_method: 'Cash',
            payment_date: '2025-10-06'
        };

        console.log('Sending payment data:', paymentData);

        const response = await axios.post('http://127.0.0.1:5000/payments', paymentData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Payment created successfully');
        console.log('Response:', response.data);

    } catch (error) {
        console.error('❌ Payment creation failed:');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testPaymentCreation();