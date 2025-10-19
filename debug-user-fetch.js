// Simple test script to check localStorage token and backend connectivity
// This will help diagnose the "Failed to fetch users" issue

console.log('=== Debugging User Fetch Issue ===\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined' && window.localStorage) {
    console.log('1. Checking localStorage token...');
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('❌ No token found in localStorage');
        console.log('💡 User needs to login first');
    } else {
        console.log('✅ Token found in localStorage');

        // Try to decode the token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', {
                userId: payload.userId,
                username: payload.username,
                role: payload.role,
                exp: new Date(payload.exp * 1000).toLocaleString(),
                isExpired: Date.now() > payload.exp * 1000
            });

            if (Date.now() > payload.exp * 1000) {
                console.log('❌ Token is expired');
                console.log('💡 User needs to login again');
            } else {
                console.log('✅ Token is valid');
            }
        } catch (e) {
            console.log('❌ Invalid token format');
            console.log('💡 User needs to login again');
        }
    }
} else {
    console.log('❌ Not in browser environment - cannot check localStorage');
}

console.log('\n2. Backend connectivity test...');
console.log('Backend should be accessible at http://localhost:5000');
console.log('Frontend should be running at http://localhost:3000');

console.log('\n=== Instructions ===');
console.log('1. Open browser at http://localhost:3000');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run this script in the console by copying and pasting the content');
console.log('5. If no token or expired token, go to login page first');