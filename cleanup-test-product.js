import axios from 'axios';

async function cleanupTestProduct() {
    const baseURL = 'http://localhost:5000';

    try {
        // Login
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Delete TEST001 product
        try {
            await axios.delete(`${baseURL}/products/TEST001`, {
                headers,
                data: { password: 'admin123' }
            });
            console.log('✅ Test product TEST001 deleted successfully');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('ℹ️ Test product TEST001 not found (already deleted or never existed)');
            } else {
                console.log('❌ Failed to delete test product:', error.response?.status, error.response?.data);
            }
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

cleanupTestProduct();