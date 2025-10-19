const axios = require('axios');

async function testBasicEndpoint() {
    try {
        console.log('🧪 Testing basic server connectivity...');

        // Test health endpoint
        const healthResponse = await axios.get('http://localhost:5000/health');

        if (healthResponse.status === 200) {
            console.log('✅ Server is running and responding!');
            console.log('📊 Health check:', healthResponse.data);
        } else {
            console.log('❌ Health check failed:', healthResponse.status);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running. Please start the server first.');
        }
    }
}

testBasicEndpoint();