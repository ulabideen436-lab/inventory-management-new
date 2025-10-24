# Firebase Authentication Setup Guide

## 🔥 Firebase Authentication Features

Your StoreFlow app now includes Firebase Authentication with:

- ✅ **Email/Password Authentication**
- ✅ **Google Sign-In** (One-click authentication)
- ✅ **Password Reset** via email
- ✅ **User Registration** with role assignment
- ✅ **Persistent Login** (auto-login on page refresh)
- ✅ **Secure Logout**

---

## 🚀 Quick Start

### 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `inventory-management-9fc64`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - ✅ **Email/Password** (Click Enable)
   - ✅ **Google** (Click Enable, select support email)
5. Click **Save**

### 2. Set Up Demo Users

Run the setup script to create demo accounts:

```bash
npm run setup-users
```

Or manually create users via Firebase Console:
- Go to **Authentication** → **Users** → **Add User**

### 3. Demo Credentials

After running the setup script, you can log in with:

**Owner Account:**
- Email: `owner@storeflow.com`
- Password: `owner123`
- Role: Owner (full access)

**Cashier Account:**
- Email: `cashier@storeflow.com`
- Password: `cashier123`
- Role: Cashier (limited access)

---

## 📱 Using the Login Page

### Sign In with Email
1. Enter your email and password
2. Click **Sign In**
3. You'll be redirected based on your role:
   - **Owner** → `/owner` (Owner Dashboard)
   - **Cashier** → `/cashier` (Cashier POS)

### Sign In with Google
1. Click **Continue with Google**
2. Select your Google account
3. New users are assigned **Cashier** role by default
4. Contact an Owner to upgrade your role

### Create New Account
1. Click **Sign Up** button
2. Enter your name, email, and password (min 6 chars)
3. Click **Sign Up**
4. New accounts start as **Cashier** role
5. Owner can upgrade roles in Firestore

### Forgot Password
1. Click **Forgot Password?**
2. Enter your email address
3. Check your email for reset link
4. Click the link and set a new password

---

## 🔒 Security Rules

### Firestore Security Rules

Update your Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    function isCashier() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'cashier';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner() || request.auth.uid == userId;
      allow delete: if isOwner();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if isSignedIn();
      allow write: if isOwner();
    }
    
    // Sales collection
    match /sales/{saleId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isOwner();
    }
    
    // Customers collection
    match /customers/{customerId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Suppliers collection
    match /suppliers/{supplierId} {
      allow read: if isSignedIn();
      allow write: if isOwner();
    }
    
    // Purchases collection
    match /purchases/{purchaseId} {
      allow read: if isSignedIn();
      allow write: if isOwner();
    }
  }
}
```

---

## 🛠️ How It Works

### Authentication Flow

```
User enters credentials
        ↓
Firebase Authentication verifies
        ↓
User data fetched from Firestore
        ↓
Role-based routing:
  - Owner → /owner
  - Cashier → /cashier
```

### User Data Structure

```javascript
{
  uid: "firebase-user-id",
  email: "user@example.com",
  displayName: "John Doe",
  role: "owner" | "cashier",
  createdAt: Timestamp,
  isActive: true,
  provider: "email" | "google",
  photoURL: "https://..." // For Google users
}
```

### Auto-Login

The app uses Firebase's `onAuthStateChanged` listener to:
- Detect when user is logged in
- Automatically load user data
- Redirect to appropriate dashboard
- Maintain session across page refreshes

---

## 🔧 Troubleshooting

### "Email already in use" error
- This email is already registered
- Try logging in instead
- Or use password reset if you forgot your password

### "Invalid email or password"
- Check your credentials
- Password is case-sensitive
- Try password reset if needed

### Google Sign-In not working
1. Ensure Google provider is enabled in Firebase Console
2. Check that support email is configured
3. Verify Firebase config in `.env` is correct
4. Make sure you're on `localhost:3000` (Firebase may block other domains)

### "Permission denied" errors
- Your account may not have proper role assigned
- Contact an Owner to update your role in Firestore
- Check Firestore security rules are deployed

---

## 👥 Managing User Roles

### Change User Role (Owner Only)

1. **Via Firebase Console:**
   - Go to Firestore Database
   - Open `users` collection
   - Select the user document
   - Change `role` field to `owner` or `cashier`

2. **Via Code (Coming Soon):**
   - User management page in Owner Dashboard
   - Ability to promote/demote users

### Role Permissions

**Owner Role:**
- ✅ Full access to all features
- ✅ Manage products, prices, inventory
- ✅ View all sales and reports
- ✅ Manage suppliers and purchases
- ✅ Access Owner POS
- ✅ Access Cashier POS

**Cashier Role:**
- ✅ Access Cashier POS
- ✅ Process sales
- ✅ Manage customers
- ✅ View product information
- ❌ Cannot edit products
- ❌ Cannot access Owner Dashboard
- ❌ Cannot view detailed reports

---

## 📝 Adding Package Script

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "setup-users": "node src/setupDemoUsers.js"
  }
}
```

---

## 🎯 Next Steps

1. ✅ Run `npm run setup-users` to create demo accounts
2. ✅ Enable Email/Password and Google auth in Firebase Console
3. ✅ Update Firestore security rules
4. ✅ Test login with demo credentials
5. ✅ Test Google Sign-In
6. ✅ Test password reset feature
7. 🔜 Add user management UI for Owners
8. 🔜 Add email verification (optional)
9. 🔜 Add multi-factor authentication (optional)

---

## 📚 Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

---

**Need help?** Check the Firebase Console logs or browser console for detailed error messages.
