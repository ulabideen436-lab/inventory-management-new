// Test customer history API directly
const axios = require('axios');

async function testCustomerHistory() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3Mzc4MjQzNzl9.z3KbdnPGLrqNP5OzFnZMNjCa8w0xKZrEQ_T5tIGrr_A'; // Replace with valid token

        console.log('Testing customer 4 history API...');
        const response = await axios.get('http://localhost:5000/customers/4/history', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response status:', response.status);
        console.log('Response data length:', response.data.length);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testCustomerHistory();