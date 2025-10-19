import axios from 'axios';
import fs from 'fs';

class AuthenticationTester {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async test(description, testFunction) {
        this.testResults.total++;
        try {
            this.log(`Testing: ${description}`);
            await testFunction();
            this.testResults.passed++;
            this.log(`PASSED: ${description}`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({ test: description, error: error.message });
            this.log(`FAILED: ${description} - ${error.message}`, 'error');
        }
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        const config = {
            method,
            url: `${this.baseURL}${endpoint}`,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        return await axios(config);
    }

    async testLoginFunctionality() {
        this.log('\n🔐 Testing Login Functionality', 'info');

        let validToken = null;

        await this.test('Valid user login', async () => {
            const response = await this.makeRequest('POST', '/auth/login', {
                username: 'owner',
                password: 'admin123'
            });

            if (response.status !== 200 || !response.data.token) {
                throw new Error('Login failed or no token received');
            }

            validToken = response.data.token;
            this.log(`Valid token received: ${validToken.substring(0, 20)}...`);
        });

        await this.test('Invalid username login', async () => {
            try {
                await this.makeRequest('POST', '/auth/login', {
                    username: 'invaliduser',
                    password: 'admin123'
                });
                throw new Error('Invalid username should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        await this.test('Invalid password login', async () => {
            try {
                await this.makeRequest('POST', '/auth/login', {
                    username: 'owner',
                    password: 'wrongpassword'
                });
                throw new Error('Invalid password should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        await this.test('Empty credentials login', async () => {
            try {
                await this.makeRequest('POST', '/auth/login', {
                    username: '',
                    password: ''
                });
                throw new Error('Empty credentials should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        await this.test('Missing credentials login', async () => {
            try {
                await this.makeRequest('POST', '/auth/login', {});
                throw new Error('Missing credentials should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        return validToken;
    }

    async testTokenValidation(token) {
        this.log('\n🔑 Testing Token Validation', 'info');

        await this.test('Valid token verification', async () => {
            const response = await this.makeRequest('GET', '/auth/verify', null, token);
            if (response.status !== 200 || !response.data.user) {
                throw new Error('Valid token verification failed');
            }
        });

        await this.test('Invalid token verification', async () => {
            try {
                await this.makeRequest('GET', '/auth/verify', null, 'invalid-token');
                throw new Error('Invalid token should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        await this.test('Expired token simulation', async () => {
            // Create a fake expired token
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid';
            try {
                await this.makeRequest('GET', '/auth/verify', null, expiredToken);
                throw new Error('Expired token should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });

        await this.test('Missing token verification', async () => {
            try {
                await this.makeRequest('GET', '/auth/verify');
                throw new Error('Missing token should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });
    }

    async testRoleBasedAccess(token) {
        this.log('\n👑 Testing Role-Based Access Control', 'info');

        await this.test('Owner access to protected resources', async () => {
            const response = await this.makeRequest('GET', '/users', null, token);
            if (response.status !== 200) {
                throw new Error('Owner should have access to user management');
            }
        });

        await this.test('Owner access to reports', async () => {
            const response = await this.makeRequest('GET', '/reports/dashboard', null, token);
            if (response.status !== 200) {
                throw new Error('Owner should have access to reports');
            }
        });

        await this.test('Access without authentication', async () => {
            try {
                await this.makeRequest('GET', '/users');
                throw new Error('Unauthenticated access should be blocked');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });
    }

    async testPasswordManagement(token) {
        this.log('\n🔒 Testing Password Management', 'info');

        await this.test('Password verification endpoint', async () => {
            const response = await this.makeRequest('POST', '/auth/verify-password', {
                password: 'admin123'
            }, token);
            if (response.status !== 200) {
                throw new Error('Password verification failed');
            }
        });

        await this.test('Wrong password verification', async () => {
            try {
                await this.makeRequest('POST', '/auth/verify-password', {
                    password: 'wrongpassword'
                }, token);
                throw new Error('Wrong password should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });
    }

    async testSessionManagement(token) {
        this.log('\n⏰ Testing Session Management', 'info');

        await this.test('User profile access with valid session', async () => {
            const response = await this.makeRequest('GET', '/auth/profile', null, token);
            if (response.status !== 200) {
                throw new Error('Profile access with valid session failed');
            }
        });

        await this.test('Multiple concurrent sessions', async () => {
            // Login with same credentials multiple times
            const response1 = await this.makeRequest('POST', '/auth/login', {
                username: 'owner',
                password: 'admin123'
            });

            const response2 = await this.makeRequest('POST', '/auth/login', {
                username: 'owner',
                password: 'admin123'
            });

            if (response1.status !== 200 || response2.status !== 200) {
                throw new Error('Multiple sessions should be allowed');
            }

            // Verify both tokens work
            await this.makeRequest('GET', '/auth/verify', null, response1.data.token);
            await this.makeRequest('GET', '/auth/verify', null, response2.data.token);
        });
    }

    generateReport() {
        const reportContent = `
# Authentication System Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${this.testResults.total}
- Passed: ${this.testResults.passed}
- Failed: ${this.testResults.failed}
- Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%

## Test Categories Completed
- ✅ Login Functionality
- ✅ Token Validation
- ✅ Role-Based Access Control
- ✅ Password Management
- ✅ Session Management

## Failed Tests
${this.testResults.errors.length === 0 ? 'None' : this.testResults.errors.map(error => `- ${error.test}: ${error.error}`).join('\n')}

## Security Assessment
${this.testResults.failed === 0 ?
                '🛡️ Authentication system is secure and working properly.' :
                `⚠️ ${this.testResults.failed} security test(s) failed. Review required.`}
`;

        fs.writeFileSync('authentication-test-report.md', reportContent);
        this.log('Authentication test report generated: authentication-test-report.md');
        return reportContent;
    }

    async runCompleteAuthTest() {
        this.log('🔐 Starting Complete Authentication System Test', 'info');
        this.log('================================================');

        try {
            const token = await this.testLoginFunctionality();
            await this.testTokenValidation(token);
            await this.testRoleBasedAccess(token);
            await this.testPasswordManagement(token);
            await this.testSessionManagement(token);

            this.log('\n================================================');
            this.log('🏁 Complete Authentication Test Finished', 'info');
            this.log(`📊 Results: ${this.testResults.passed}/${this.testResults.total} tests passed`);

            const report = this.generateReport();
            console.log(report);

        } catch (error) {
            this.log(`💥 Critical error during authentication testing: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run the authentication tests
async function main() {
    const tester = new AuthenticationTester();
    await tester.runCompleteAuthTest();
}

main().catch(console.error);

export default AuthenticationTester;