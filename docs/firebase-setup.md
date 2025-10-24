# Firebase Setup Guide

This guide provides detailed instructions for setting up Firebase for your StoreFlow application.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "storeflow-inventory")
4. Enable Google Analytics (optional but recommended)
5. Choose or create a Google Analytics account
6. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Set Up Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll update rules later)
4. Select a location closest to your users
5. Click "Done"

### Set Up Security Rules

1. Go to the "Rules" tab in Firestore
2. Replace the default rules with the rules from `firebase/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products can be read by authenticated users, written by admins/owners
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'owner']);
    }
    
    // Add other rules as needed...
  }
}
```

3. Click "Publish"

## Step 4: Enable Cloud Storage (Optional)

1. Click "Storage" in the left sidebar
2. Click "Get started"
3. Review the security rules and click "Next"
4. Choose a location and click "Done"

## Step 5: Get Your Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. If you haven't added a web app yet:
   - Click the web icon (`</>`)
   - Enter an app nickname (e.g., "StoreFlow Web")
   - Optionally enable Firebase Hosting
   - Click "Register app"

5. Copy the Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};
```

## Step 6: Update Your Application

1. Open `src/config/firebase.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-actual-app-id"
};

export default firebaseConfig;
```

3. Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Step 7: Initialize Sample Data (Optional)

You can create some initial collections and documents in Firestore:

### Create Initial Collections

1. Go to Firestore Database in Firebase Console
2. Click "Start collection"
3. Create these collections:

#### Users Collection
- Collection ID: `users`
- First document:
  - Document ID: (auto-generated)
  - Fields:
    - `displayName`: "Admin User"
    - `email`: "admin@storeflow.com"
    - `role`: "admin"
    - `createdAt`: (timestamp)
    - `isActive`: true

#### Products Collection
- Collection ID: `products`
- First document:
  - Document ID: (auto-generated)
  - Fields:
    - `name`: "Sample Product"
    - `category`: "General"
    - `retailPrice`: 10.00
    - `wholesalePrice`: 8.00
    - `stock`: 100
    - `supplier`: "Sample Supplier"
    - `createdAt`: (timestamp)

#### Customers Collection
- Collection ID: `customers`
- First document:
  - Document ID: (auto-generated)
  - Fields:
    - `name`: "Walk-in Customer"
    - `type`: "retail"
    - `phone`: ""
    - `email`: ""
    - `balance`: 0
    - `createdAt`: (timestamp)

## Step 8: Test Your Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`
3. Try to register a new user
4. Check if the user appears in Firebase Authentication
5. Verify that user data is saved in Firestore

## Firebase CLI Setup (Optional)

For deployment and advanced features:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```

4. Select the services you want to use:
   - Firestore
   - Hosting
   - Storage (optional)

## Environment Variables

For production, consider using environment variables:

1. Create `.env` file in your project root:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

2. Update `src/config/firebase.js` to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.REACT_APP_FIREBASE_APP_ID
   };
   ```

## Security Best Practices

1. **Never expose your private keys** - Only use the public Firebase config
2. **Set up proper Firestore rules** - Don't leave your database open
3. **Enable App Check** (optional) - For additional security
4. **Use environment variables** - For different environments (dev, staging, prod)
5. **Enable audit logging** - Monitor database access

## Troubleshooting

### Common Issues

1. **"Firebase App not initialized"**
   - Check if Firebase is properly imported and initialized
   - Verify your config values are correct

2. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure user is authenticated before accessing data

3. **"Project not found"**
   - Verify your project ID in `.firebaserc`
   - Make sure you're using the correct Firebase project

4. **Authentication not working**
   - Ensure Email/Password is enabled in Firebase Console
   - Check for typos in your Firebase config

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## Next Steps

- [Getting Started Guide](getting-started.md) - Complete setup guide
- [API Documentation](api.md) - Data structure and API usage
- [Deployment Guide](deployment.md) - Deploy your application