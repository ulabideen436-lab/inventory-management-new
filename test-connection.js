/**
 * Simple server connectivity test
 */

const axios = require('axios');

async function testConnection() {
    try {
        console.log('Testing connection to backend...');
        const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
        console.log('✅ Server is accessible');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);

        // Try different URLs
        const urls = [
            'http://127.0.0.1:5000/health',
            'http://0.0.0.0:5000/health'
        ];

        for (const url of urls) {
            try {
                console.log(`Trying ${url}...`);
                const response = await axios.get(url, { timeout: 3000 });
                console.log(`✅ ${url} works!`);
                console.log('Response:', response.data);
                break;
            } catch (err) {
                console.log(`❌ ${url} failed:`, err.message);
            }
        }
    }
}

testConnection();