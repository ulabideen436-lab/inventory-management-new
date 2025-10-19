import axios from 'axios';

async function testOwnerUnlimitedLogin() {
    console.log('Testing unlimited login for owner...\n');

    const baseURL = 'http://localhost:5000';
    const loginData = {
        username: 'owner',
        password: 'admin123'
    };

    console.log('Attempting multiple rapid login attempts for owner...');

    for (let i = 1; i <= 10; i++) {
        try {
            console.log(`Attempt ${i}: `, { endpoint: `${baseURL}/auth/login`, username: loginData.username });

            const response = await axios.post(`${baseURL}/auth/login`, loginData);
            console.log(`✅ Attempt ${i} successful - Status: ${response.status}`);

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.log(`❌ Attempt ${i} failed - Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`);

            if (error.response?.status === 429) {
                console.log('🚫 Rate limiting detected - this should NOT happen for owner!');
                break;
            }
        }
    }

    console.log('\n--- Testing with other user ---');

    // Test that rate limiting still works for non-owner users
    const nonOwnerData = {
        username: 'cashier',
        password: 'wrongpassword'
    };

    console.log('Testing rate limiting for non-owner user (with wrong password)...');

    for (let i = 1; i <= 5; i++) {
        try {
            console.log(`Non-owner attempt ${i}:`);

            const response = await axios.post(`${baseURL}/auth/login`, nonOwnerData);
            console.log(`Unexpected success: ${response.status}`);

        } catch (error) {
            console.log(`Expected failure ${i} - Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`);

            if (error.response?.status === 429) {
                console.log('✅ Rate limiting working correctly for non-owner users');
                break;
            }
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

testOwnerUnlimitedLogin().catch(console.error);