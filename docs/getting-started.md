# Getting Started with StoreFlow

This guide will help you set up and run the StoreFlow inventory management system.

## Prerequisites

Before you begin, make sure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/storeflow.git
cd storeflow
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Required Services**
   - **Firestore Database**: Go to Firestore Database and create a database
   - **Authentication**: Enable Email/Password authentication
   - **Storage**: Enable Cloud Storage (optional)

3. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web app icon (`</>`)
   - Copy the Firebase configuration object

4. **Update Configuration**
   - Open `src/config/firebase.js`
   - Replace the placeholder values with your actual Firebase config:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-actual-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-actual-app-id"
   };
   ```

## Step 4: Update Firebase Project ID

Update the `.firebaserc` file with your project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Step 5: Set Up Firestore Security Rules

1. Go to Firebase Console > Firestore Database > Rules
2. Copy the rules from `firebase/firestore.rules` and paste them
3. Publish the rules

## Step 6: Create Your First Admin User

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and go to `http://localhost:3000`
3. Go to the registration page and create your first admin account

## Step 7: Start Using StoreFlow

You're all set! You can now:
- Add products to your inventory
- Create customer profiles
- Process sales through the POS system
- Generate reports and analytics

## Development Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `firebase serve` - Serve the app locally using Firebase hosting
- `firebase deploy` - Deploy to Firebase hosting

## Troubleshooting

### Common Issues

1. **Firebase configuration errors**
   - Double-check your Firebase config values
   - Ensure all required services are enabled

2. **Authentication issues**
   - Verify that Email/Password authentication is enabled
   - Check Firestore security rules

3. **Deployment issues**
   - Run `npm run build` before deploying
   - Ensure Firebase CLI is installed: `npm install -g firebase-tools`

## Next Steps

- [Firebase Setup Guide](firebase-setup.md) - Detailed Firebase configuration
- [API Documentation](api.md) - Learn about the data structure
- [Deployment Guide](deployment.md) - Deploy to production

## Support

If you encounter any issues, please check the documentation or create an issue on the GitHub repository.