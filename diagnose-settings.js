// Simple diagnostic test for Settings functionality
const axios = require('axios');

console.log('🔍 SETTINGS PROBLEMS DIAGNOSTIC');
console.log('===============================');

// Check server connectivity
async function checkServerStatus() {
    console.log('\n1. 🌐 Checking server connectivity...');

    const urls = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5000/health'
    ];

    for (const url of urls) {
        try {
            console.log(`   Testing: ${url}`);
            const response = await axios.get(url, { timeout: 3000 });
            console.log(`   ✅ ${url} - Status: ${response.status}`);
        } catch (error) {
            console.log(`   ❌ ${url} - Error: ${error.code || error.message}`);
        }
    }
}

// Check authentication endpoint
async function checkAuthEndpoint() {
    console.log('\n2. 🔐 Checking authentication endpoint...');

    try {
        const response = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        }, { timeout: 5000 });

        console.log('   ✅ Authentication endpoint working');
        return response.data.token;
    } catch (error) {
        console.log(`   ❌ Authentication failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        return null;
    }
}

// Check users endpoint
async function checkUsersEndpoint(token) {
    console.log('\n3. 👥 Checking users endpoint...');

    if (!token) {
        console.log('   ⏩ Skipped - No authentication token');
        return;
    }

    try {
        const response = await axios.get('http://localhost:5000/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`   ✅ Users endpoint working - Found ${response.data.length} users`);

        // Check user data structure
        if (response.data.length > 0) {
            const user = response.data[0];
            console.log('   📋 Sample user fields:', Object.keys(user).join(', '));

            // Check for required fields
            const requiredFields = ['id', 'username', 'role', 'active'];
            const missingFields = requiredFields.filter(field => !(field in user));

            if (missingFields.length === 0) {
                console.log('   ✅ User data structure complete');
            } else {
                console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
            }
        }

        return response.data;
    } catch (error) {
        console.log(`   ❌ Users endpoint failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        return null;
    }
}

// Check settings endpoint
async function checkSettingsEndpoint(token) {
    console.log('\n4. ⚙️ Checking settings endpoint...');

    if (!token) {
        console.log('   ⏩ Skipped - No authentication token');
        return;
    }

    try {
        const response = await axios.get('http://localhost:5000/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   ✅ Settings endpoint working');
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('   ⚠️ Settings endpoint not implemented (404)');
        } else {
            console.log(`   ❌ Settings endpoint failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
        return null;
    }
}

// Check frontend Settings.js file
async function checkFrontendFile() {
    console.log('\n5. 📁 Checking frontend Settings.js file...');

    const fs = require('fs');
    const path = require('path');

    const settingsPath = path.join(__dirname, 'frontend', 'src', 'components', 'Settings.js');

    try {
        if (fs.existsSync(settingsPath)) {
            const content = fs.readFileSync(settingsPath, 'utf8');

            // Check for API endpoints
            const apiEndpoints = [
                'localhost:5000/users',
                'localhost:5000/settings',
                'localhost:5000/backup',
                'localhost:5000/export'
            ];

            console.log('   📋 Checking API endpoint configurations...');
            for (const endpoint of apiEndpoints) {
                if (content.includes(endpoint)) {
                    console.log(`   ✅ ${endpoint} - Configured`);
                } else {
                    console.log(`   ❌ ${endpoint} - Missing or incorrect URL`);
                }
            }

            // Check for function implementations
            const functions = [
                'fetchUsers',
                'handleAddUser',
                'handleDeleteUser',
                'handleDeactivateUser',
                'handleReactivateUser',
                'fetchSystemSettings',
                'handleUpdateSettings'
            ];

            console.log('   🔧 Checking function implementations...');
            for (const func of functions) {
                if (content.includes(func)) {
                    console.log(`   ✅ ${func} - Implemented`);
                } else {
                    console.log(`   ❌ ${func} - Missing`);
                }
            }

        } else {
            console.log('   ❌ Settings.js file not found');
        }
    } catch (error) {
        console.log(`   ❌ Error checking frontend file: ${error.message}`);
    }
}

// Main diagnostic function
async function runDiagnostic() {
    await checkServerStatus();
    const token = await checkAuthEndpoint();
    await checkUsersEndpoint(token);
    await checkSettingsEndpoint(token);
    await checkFrontendFile();

    console.log('\n📊 DIAGNOSTIC COMPLETE');
    console.log('======================');
    console.log('');
    console.log('Next steps:');
    console.log('1. If server connectivity fails - restart backend server');
    console.log('2. If authentication fails - check user credentials in database');
    console.log('3. If endpoints fail - check backend implementation');
    console.log('4. If frontend issues found - fix API URLs or function implementations');
}

runDiagnostic().catch(error => {
    console.error('❌ Diagnostic failed:', error.message);
});