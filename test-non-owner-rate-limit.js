import axios from 'axios';

async function testRateLimitingForNonOwner() {
    console.log('Testing rate limiting for non-owner users...\n');

    const baseURL = 'http://localhost:5000';
    const nonOwnerData = {
        username: 'testuser',
        password: 'wrongpassword'
    };

    console.log('Making many requests quickly to trigger rate limiting...');

    for (let i = 1; i <= 60; i++) {
        try {
            const response = await axios.post(`${baseURL}/auth/login`, nonOwnerData);
            console.log(`Attempt ${i} - Unexpected success: ${response.status}`);

        } catch (error) {
            if (error.response?.status === 429) {
                console.log(`✅ Attempt ${i} - Rate limiting triggered (Status: 429)`);
                console.log(`Message: ${error.response?.data?.message || error.message}`);
                break;
            } else {
                // Expected auth failures
                if (i % 10 === 0) {
                    console.log(`Attempt ${i} - Auth failure (Status: ${error.response?.status})`);
                }
            }
        }

        // Small delay to avoid overwhelming
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}

testRateLimitingForNonOwner().catch(console.error);