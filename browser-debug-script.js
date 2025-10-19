// Browser diagnostic script - copy and paste this into the browser console
console.log('=== StoreFlow Frontend Diagnostic ===\n');

// Check localStorage token
const token = localStorage.getItem('token');
console.log('1. Token Status:');
if (!token) {
    console.log('❌ No token found in localStorage');
    console.log('💡 You need to login first');
} else {
    console.log('✅ Token found in localStorage');
    console.log('Token length:', token.length);

    // Try to decode token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() > payload.exp * 1000;

        console.log('Token details:');
        console.log('- User:', payload.username);
        console.log('- Role:', payload.role);
        console.log('- Expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('- Status:', isExpired ? '❌ EXPIRED' : '✅ Valid');

        if (isExpired) {
            console.log('💡 Token is expired - please login again');
        }
    } catch (e) {
        console.log('❌ Token format is invalid');
        console.log('💡 Please login again');
    }
}

// Test API call directly from browser
console.log('\n2. Testing API call from browser...');
if (token) {
    fetch('/users', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('API Response Status:', response.status);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(users => {
            console.log('✅ API call successful');
            console.log('Users count:', users.length);
            console.log('Users:', users.map(u => `${u.username} (${u.role})`));
        })
        .catch(error => {
            console.log('❌ API call failed:', error.message);
            if (error.message.includes('429')) {
                console.log('💡 Rate limited - wait a few minutes');
            } else if (error.message.includes('401')) {
                console.log('💡 Authentication failed - login again');
            }
        });
}

console.log('\n3. Instructions:');
console.log('- If token is missing/expired: Go to login page');
console.log('- If API call fails: Check network tab in dev tools');
console.log('- Current URL:', window.location.href);