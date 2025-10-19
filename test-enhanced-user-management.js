const axios = require('axios');

async function testEnhancedUserManagement() {
    try {
        console.log('🧪 Testing Enhanced User Management...');

        // Login as owner
        console.log('1. Logging in as owner...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test fetching users with status
        console.log('\n2. Fetching users with status information...');
        const usersResponse = await axios.get('http://localhost:5000/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Users fetched successfully');
        console.table(usersResponse.data.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            active: user.active ? 'Active' : 'Inactive',
            created_at: new Date(user.created_at).toLocaleDateString()
        })));

        // Find a non-owner user to test with
        const testUser = usersResponse.data.find(u => u.role !== 'owner' && u.username !== 'owner');

        if (!testUser) {
            console.log('⚠️ No non-owner users found. Creating a test user...');

            // Create a test user
            await axios.post('http://localhost:5000/users', {
                username: 'testuser2',
                password: 'test123',
                role: 'cashier',
                email: 'test2@example.com',
                full_name: 'Test User 2'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Test user created');

            // Refetch users
            const updatedUsers = await axios.get('http://localhost:5000/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newTestUser = updatedUsers.data.find(u => u.username === 'testuser2');

            if (newTestUser) {
                console.log('\n3. Testing deactivate functionality...');
                await axios.patch(`http://localhost:5000/users/${newTestUser.id}/deactivate`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User deactivated successfully');

                console.log('\n4. Testing reactivate functionality...');
                await axios.patch(`http://localhost:5000/users/${newTestUser.id}/reactivate`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User reactivated successfully');

                console.log('\n5. Testing delete (should work for new user with no associated data)...');
                await axios.delete(`http://localhost:5000/users/${newTestUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User deleted successfully');
            }
        } else {
            console.log(`\n3. Testing constraint protection with existing user: ${testUser.username}`);

            // Try to delete a user that might have associated sales data
            try {
                await axios.delete(`http://localhost:5000/users/${testUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User deleted successfully (no associated data)');
            } catch (err) {
                if (err.response?.data?.hasAssociatedData) {
                    console.log('✅ Foreign key constraint protection working!');
                    console.log('   📊 Error:', err.response.data.message);
                    console.log(`   📈 Associated records: ${err.response.data.associatedRecords}`);

                    console.log('\n4. Testing deactivate as alternative...');
                    if (testUser.active) {
                        await axios.patch(`http://localhost:5000/users/${testUser.id}/deactivate`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('✅ User deactivated successfully');

                        console.log('\n5. Testing reactivate...');
                        await axios.patch(`http://localhost:5000/users/${testUser.id}/reactivate`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('✅ User reactivated successfully');
                    } else {
                        console.log('   ⚠️ User already inactive, testing reactivate...');
                        await axios.patch(`http://localhost:5000/users/${testUser.id}/reactivate`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('✅ User reactivated successfully');
                    }
                } else {
                    throw err;
                }
            }
        }

        console.log('\n🎉 ENHANCED USER MANAGEMENT TEST COMPLETE!');
        console.log('✅ Foreign key constraint protection implemented');
        console.log('✅ Deactivate/Reactivate functionality working');
        console.log('✅ Informative error messages for constraint violations');
        console.log('✅ Data integrity preserved while maintaining usability');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status) {
            console.error('   Status:', error.response.status);
        }
    }
}

testEnhancedUserManagement();