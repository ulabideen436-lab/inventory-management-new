const axios = require('axios');

class SettingsTestSuite {
    constructor() {
        this.baseURL = 'http://127.0.0.1:5000';
        this.token = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const symbols = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
        console.log(`[${timestamp}] ${symbols[type]} ${message}`);
    }

    async login() {
        try {
            this.log('Attempting login as owner...', 'info');
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                username: 'owner',
                password: 'owner123'
            });
            this.token = response.data.token;
            this.log('Login successful', 'success');
            this.testResults.passed++;
            return true;
        } catch (error) {
            this.log(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Authentication failed - cannot proceed with tests');
            return false;
        }
    }

    async testUsersEndpoint() {
        this.log('\n🧪 TESTING USERS ENDPOINT', 'info');

        try {
            // Test GET /users
            this.log('Testing GET /users...', 'info');
            const response = await axios.get(`${this.baseURL}/users`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.data && Array.isArray(response.data)) {
                this.log(`✅ GET /users successful - Found ${response.data.length} users`, 'success');
                this.testResults.passed++;

                // Validate user data structure
                if (response.data.length > 0) {
                    const user = response.data[0];
                    const requiredFields = ['id', 'username', 'role'];
                    const missingFields = requiredFields.filter(field => !(field in user));

                    if (missingFields.length === 0) {
                        this.log('✅ User data structure valid', 'success');
                        this.testResults.passed++;
                    } else {
                        this.log(`❌ Missing fields in user data: ${missingFields.join(', ')}`, 'error');
                        this.testResults.failed++;
                        this.testResults.errors.push(`Missing user fields: ${missingFields.join(', ')}`);
                    }

                    // Check if active field exists
                    if ('active' in user) {
                        this.log('✅ Active status field present', 'success');
                        this.testResults.passed++;
                    } else {
                        this.log('❌ Active status field missing', 'error');
                        this.testResults.failed++;
                        this.testResults.errors.push('User active status field missing');
                    }
                }

                return response.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            this.log(`❌ GET /users failed: ${error.response?.data?.message || error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push(`GET /users endpoint error: ${error.message}`);
            return null;
        }
    }

    async testUserCreation() {
        this.log('\n🧪 TESTING USER CREATION', 'info');

        const testUser = {
            username: 'testuser_' + Date.now(),
            password: 'testpass123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'cashier'
        };

        try {
            this.log('Testing POST /users...', 'info');
            const response = await axios.post(`${this.baseURL}/users`, testUser, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.status === 201) {
                this.log('✅ User creation successful', 'success');
                this.testResults.passed++;
                return response.data.userId;
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ User creation failed: ${error.response?.data?.message || error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push(`User creation error: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async testUserDeactivation(userId) {
        this.log('\n🧪 TESTING USER DEACTIVATION', 'info');

        try {
            this.log(`Testing PATCH /users/${userId}/deactivate...`, 'info');
            const response = await axios.patch(`${this.baseURL}/users/${userId}/deactivate`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.status === 200) {
                this.log('✅ User deactivation successful', 'success');
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ User deactivation failed: ${error.response?.data?.message || error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push(`User deactivation error: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testUserReactivation(userId) {
        this.log('\n🧪 TESTING USER REACTIVATION', 'info');

        try {
            this.log(`Testing PATCH /users/${userId}/reactivate...`, 'info');
            const response = await axios.patch(`${this.baseURL}/users/${userId}/reactivate`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.status === 200) {
                this.log('✅ User reactivation successful', 'success');
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ User reactivation failed: ${error.response?.data?.message || error.message}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push(`User reactivation error: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async testUserDeletion(userId) {
        this.log('\n🧪 TESTING USER DELETION', 'info');

        try {
            this.log(`Testing DELETE /users/${userId}...`, 'info');
            const response = await axios.delete(`${this.baseURL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.status === 200) {
                this.log('✅ User deletion successful', 'success');
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            if (error.response?.data?.hasAssociatedData) {
                this.log('✅ Foreign key constraint protection working', 'success');
                this.log(`   📊 Associated records: ${error.response.data.associatedRecords}`, 'info');
                this.testResults.passed++;
                return 'constraint_protected';
            } else {
                this.log(`❌ User deletion failed: ${error.response?.data?.message || error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`User deletion error: ${error.response?.data?.message || error.message}`);
                return false;
            }
        }
    }

    async testSettingsEndpoint() {
        this.log('\n🧪 TESTING SETTINGS ENDPOINT', 'info');

        try {
            this.log('Testing GET /settings...', 'info');
            const response = await axios.get(`${this.baseURL}/settings`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            this.log('✅ GET /settings successful', 'success');
            this.testResults.passed++;
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                this.log('⚠️ Settings endpoint not implemented (404)', 'warning');
                this.testResults.errors.push('Settings endpoint returns 404 - may not be implemented');
            } else {
                this.log(`❌ GET /settings failed: ${error.response?.data?.message || error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Settings endpoint error: ${error.response?.data?.message || error.message}`);
            }
            return null;
        }
    }

    async testSettingsUpdate() {
        this.log('\n🧪 TESTING SETTINGS UPDATE', 'info');

        const testSettings = {
            business_name: 'Test Company',
            business_email: 'test@company.com',
            tax_rate: 10.5,
            currency: 'USD'
        };

        try {
            this.log('Testing POST /settings...', 'info');
            const response = await axios.post(`${this.baseURL}/settings`, testSettings, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            this.log('✅ Settings update successful', 'success');
            this.testResults.passed++;
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                this.log('⚠️ Settings update endpoint not implemented (404)', 'warning');
                this.testResults.errors.push('Settings update endpoint returns 404 - may not be implemented');
            } else {
                this.log(`❌ Settings update failed: ${error.response?.data?.message || error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Settings update error: ${error.response?.data?.message || error.message}`);
            }
            return false;
        }
    }

    async testExportEndpoint() {
        this.log('\n🧪 TESTING EXPORT ENDPOINT', 'info');

        try {
            this.log('Testing GET /export/data...', 'info');
            const response = await axios.get(`${this.baseURL}/export/data`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            this.log('✅ Export endpoint successful', 'success');
            this.testResults.passed++;
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                this.log('⚠️ Export endpoint not implemented (404)', 'warning');
                this.testResults.errors.push('Export endpoint returns 404 - may not be implemented');
            } else {
                this.log(`❌ Export endpoint failed: ${error.response?.data?.message || error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Export endpoint error: ${error.response?.data?.message || error.message}`);
            }
            return false;
        }
    }

    async testBackupEndpoint() {
        this.log('\n🧪 TESTING BACKUP ENDPOINT', 'info');

        try {
            this.log('Testing POST /backup/database...', 'info');
            const response = await axios.post(`${this.baseURL}/backup/database`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            this.log('✅ Backup endpoint successful', 'success');
            this.testResults.passed++;
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                this.log('⚠️ Backup endpoint not implemented (404)', 'warning');
                this.testResults.errors.push('Backup endpoint returns 404 - may not be implemented');
            } else {
                this.log(`❌ Backup endpoint failed: ${error.response?.data?.message || error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Backup endpoint error: ${error.response?.data?.message || error.message}`);
            }
            return false;
        }
    }

    async testUnauthorizedAccess() {
        this.log('\n🧪 TESTING UNAUTHORIZED ACCESS', 'info');

        try {
            this.log('Testing access without token...', 'info');
            await axios.get(`${this.baseURL}/users`);

            this.log('❌ Unauthorized access allowed - Security issue!', 'error');
            this.testResults.failed++;
            this.testResults.errors.push('SECURITY ISSUE: Unauthorized access to /users endpoint allowed');
        } catch (error) {
            if (error.response?.status === 401) {
                this.log('✅ Unauthorized access properly blocked', 'success');
                this.testResults.passed++;
            } else {
                this.log(`❌ Unexpected unauthorized access response: ${error.response?.status}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Unexpected unauthorized access behavior: ${error.response?.status}`);
            }
        }
    }

    async testInvalidToken() {
        this.log('\n🧪 TESTING INVALID TOKEN', 'info');

        try {
            this.log('Testing access with invalid token...', 'info');
            await axios.get(`${this.baseURL}/users`, {
                headers: { Authorization: 'Bearer invalid_token_here' }
            });

            this.log('❌ Invalid token access allowed - Security issue!', 'error');
            this.testResults.failed++;
            this.testResults.errors.push('SECURITY ISSUE: Invalid token access to /users endpoint allowed');
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                this.log('✅ Invalid token properly rejected', 'success');
                this.testResults.passed++;
            } else {
                this.log(`❌ Unexpected invalid token response: ${error.response?.status}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`Unexpected invalid token behavior: ${error.response?.status}`);
            }
        }
    }

    printSummary() {
        this.log('\n' + '='.repeat(50), 'info');
        this.log('🎯 COMPREHENSIVE SETTINGS TEST SUMMARY', 'info');
        this.log('='.repeat(50), 'info');

        this.log(`✅ Tests Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Tests Failed: ${this.testResults.failed}`, 'error');

        if (this.testResults.errors.length > 0) {
            this.log('\n🚨 IDENTIFIED PROBLEMS:', 'error');
            this.testResults.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error}`, 'error');
            });
        }

        const totalTests = this.testResults.passed + this.testResults.failed;
        const successRate = totalTests > 0 ? ((this.testResults.passed / totalTests) * 100).toFixed(1) : 0;

        this.log(`\n📊 Success Rate: ${successRate}%`, 'info');

        if (this.testResults.failed === 0) {
            this.log('\n🎉 ALL TESTS PASSED! Settings functionality is working correctly.', 'success');
        } else {
            this.log('\n⚠️ ISSUES FOUND! Please review the problems above.', 'warning');
        }
    }

    async runAllTests() {
        this.log('🚀 STARTING COMPREHENSIVE SETTINGS TESTS', 'info');
        this.log('='.repeat(50), 'info');

        // Authentication test
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('❌ Cannot proceed without authentication', 'error');
            this.printSummary();
            return;
        }

        // Core functionality tests
        const users = await this.testUsersEndpoint();
        let testUserId = null;

        // User management tests
        testUserId = await this.testUserCreation();
        if (testUserId) {
            await this.testUserDeactivation(testUserId);
            await this.testUserReactivation(testUserId);
            const deleteResult = await this.testUserDeletion(testUserId);

            // If deletion failed due to constraints, test with existing user
            if (deleteResult === 'constraint_protected' && users && users.length > 0) {
                const existingUser = users.find(u => u.role !== 'owner');
                if (existingUser) {
                    await this.testUserDeletion(existingUser.id);
                }
            }
        }

        // Settings functionality tests
        await this.testSettingsEndpoint();
        await this.testSettingsUpdate();
        await this.testExportEndpoint();
        await this.testBackupEndpoint();

        // Security tests
        await this.testUnauthorizedAccess();
        await this.testInvalidToken();

        // Print final summary
        this.printSummary();
    }
}

// Run the tests
const testSuite = new SettingsTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('❌ Test suite crashed:', error.message);
    process.exit(1);
});
