// Quick diagnostic tool to check authentication and API connectivity
console.log('=== StoreFlow Authentication Diagnostic ===\n');

// Check localStorage token
if (typeof window !== 'undefined' && window.localStorage) {
    const token = localStorage.getItem('token');
    console.log('1. Token Check:');

    if (!token) {
        console.log('❌ No authentication token found');
        console.log('💡 Please login at: http://localhost:3000');
        return;
    }

    console.log('✅ Token found in localStorage');

    // Decode token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() > payload.exp * 1000;

        console.log('Token Details:');
        console.log('- User:', payload.username);
        console.log('- Role:', payload.role);
        console.log('- Expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('- Status:', isExpired ? '❌ EXPIRED' : '✅ Valid');

        if (isExpired) {
            console.log('\n💡 Token expired - please login again');
            return;
        }

    } catch (e) {
        console.log('❌ Invalid token format');
        console.log('💡 Please login again');
        return;
    }

    console.log('\n2. Testing API Connection...');

    // Test backend connectivity
    fetch('http://localhost:5000/users', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('API Response Status:', response.status);

            if (response.status === 200) {
                return response.json();
            } else if (response.status === 401) {
                console.log('❌ Authentication failed - token may be invalid');
            } else if (response.status === 429) {
                console.log('❌ Rate limited - too many requests');
                console.log('💡 Wait a few minutes before trying again');
            } else {
                console.log('❌ Unexpected response status');
            }
            throw new Error(`HTTP ${response.status}`);
        })
        .then(users => {
            console.log('✅ API connection successful');
            console.log('Users found:', users.length);
            console.log('Users:', users.map(u => `${u.username} (${u.role})`));
        })
        .catch(error => {
            console.log('❌ API connection failed:', error.message);
        });

} else {
    console.log('❌ Not in browser environment');
}

console.log('\n=== Instructions ===');
console.log('1. Copy this entire script');
console.log('2. Open browser at http://localhost:3000');
console.log('3. Open developer tools (F12)');
console.log('4. Go to Console tab');
console.log('5. Paste and run this script');
console.log('6. If token is expired or missing, login again');