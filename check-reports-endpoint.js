const axios = require('axios');

async function checkReportsEndpoint() {
    try {
        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginRes.data.token;

        console.log('Checking reports endpoint for discount calculations...\n');

        try {
            const reportsRes = await axios.get('http://127.0.0.1:5000/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('REPORTS ENDPOINT DATA:');
            console.log('Response structure:', Object.keys(reportsRes.data));

            if (reportsRes.data.totalDiscounts !== undefined) {
                console.log(`Reports Total Discounts: ${reportsRes.data.totalDiscounts}`);
            }

            // Look for any discount-related fields
            const dataStr = JSON.stringify(reportsRes.data);
            if (dataStr.includes('56.60')) {
                console.log('✅ Found 56.60 in reports endpoint - this might be the source!');
            }

            if (dataStr.includes('discount')) {
                console.log('Found discount-related data in reports');
                // Extract discount-related parts
                const discountMatches = dataStr.match(/"[^"]*discount[^"]*":[^,}]*/gi);
                if (discountMatches) {
                    console.log('Discount fields found:', discountMatches);
                }
            }

            console.log('\nFull reports response:');
            console.log(JSON.stringify(reportsRes.data, null, 2));

        } catch (error) {
            if (error.response?.status === 404) {
                console.log('Reports endpoint not found');
            } else {
                console.log('Reports endpoint error:', error.response?.data || error.message);
            }
        }

        // Also check if there are other dashboard-specific endpoints
        console.log('\nChecking other possible dashboard endpoints...');

        const endpointsToCheck = [
            '/reports/dashboard',
            '/dashboard',
            '/analytics',
            '/reports/summary'
        ];

        for (const endpoint of endpointsToCheck) {
            try {
                const res = await axios.get(`http://127.0.0.1:5000${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`✅ ${endpoint} exists`);

                const dataStr = JSON.stringify(res.data);
                if (dataStr.includes('56.60')) {
                    console.log(`🎯 Found 56.60 in ${endpoint} - this is likely the dashboard data source!`);
                    console.log('Response:', JSON.stringify(res.data, null, 2));
                }
            } catch (e) {
                console.log(`❌ ${endpoint} not found`);
            }
        }

    } catch (error) {
        console.error('Check failed:', error.response?.data || error.message);
    }
}

checkReportsEndpoint();