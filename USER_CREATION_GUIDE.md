# User Creation by Owner - Implementation Guide

## 🚨 Important Note

Firebase client SDK does not support creating users while another user is authenticated. This is a security feature to prevent privilege escalation.

## ✅ Recommended Solutions

### Solution 1: Firebase Cloud Functions (Recommended for Production)

Create a Cloud Function that uses Firebase Admin SDK:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated and is owner
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only owners can create users');
  }

  const { email, password, displayName, role } = data;

  try {
    // Create user with Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      role: role || 'cashier',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
      isActive: true,
      provider: 'email'
    });

    return {
      success: true,
      uid: userRecord.uid,
      message: `User ${displayName} created successfully`
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Solution 2: Temporary Workaround (Development Only)

For development/testing, you can:

1. **Manual Creation in Firebase Console**
   - Go to Firebase Console → Authentication → Users
   - Click "Add User"
   - Enter email and password
   - Then go to Firestore → users collection
   - Add user document with role

2. **Use setupDemoUsers.js Script**
   - Run the script when NOT logged in
   - Script creates users directly
   - Then manually set roles in Firestore

### Solution 3: Invite System (Alternative)

Instead of creating users directly, send invitation emails:

```javascript
// Owner sends invitation
async sendUserInvitation(email, role) {
  // Store invitation in Firestore
  await setDoc(doc(db, 'invitations', email), {
    email,
    role,
    invitedBy: currentUser.uid,
    invitedAt: new Date(),
    status: 'pending'
  });

  // Send email with signup link
  await sendInvitationEmail(email, role);
}

// New user signs up with invitation code
async signUpWithInvitation(email, password, displayName, invitationCode) {
  // Verify invitation exists
  const invitation = await getDoc(doc(db, 'invitations', email));
  
  if (!invitation.exists()) {
    throw new Error('Invalid invitation');
  }

  // Create user with invited role
  const { user, userData } = await this.signUp(email, password, displayName, invitation.data().role);
  
  // Mark invitation as used
  await updateDoc(doc(db, 'invitations', email), {
    status: 'accepted',
    acceptedAt: new Date()
  });

  return { user, userData };
}
```

## 🔧 Current Implementation

The current implementation in UserManagement creates user records in Firestore but **does not create Firebase Auth accounts**. 

**Limitations:**
- Users created this way cannot log in
- They exist only in Firestore, not in Firebase Authentication
- This is a placeholder for proper implementation

**To fix:**
1. Implement Cloud Functions (Solution 1) - **RECOMMENDED**
2. Or use invitation system (Solution 3)
3. Or manually create in Firebase Console for now

## 📝 Setup Cloud Functions (Production Solution)

### 1. Initialize Firebase Functions

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### 2. Install Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions
```

### 3. Create Function

Create `functions/index.js` with the code from Solution 1 above.

### 4. Deploy Function

```bash
firebase deploy --only functions
```

### 5. Update Frontend

```javascript
// src/services/authService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

async createUserByOwner(email, password, displayName, role = 'cashier') {
  const functions = getFunctions();
  const createUser = httpsCallable(functions, 'createUser');
  
  try {
    const result = await createUser({
      email,
      password,
      displayName,
      role
    });
    
    return result.data;
  } catch (error) {
    throw new Error(error.message);
  }
}
```

## 🎯 Quick Start for Testing

**Option A: Use Firebase Console**
1. Go to Firebase Console
2. Authentication → Users → Add User
3. Then Firestore → users → Add Document
4. Set role: owner or cashier

**Option B: Run Setup Script (When Logged Out)**
```bash
# Make sure you're logged out of the app first
node src/setupDemoUsers.js
```

**Option C: Implement Cloud Functions** (See above)

## ⚠️ Security Notes

1. **Never store passwords in Firestore** (current temp solution does this - NOT SECURE)
2. **Always use Firebase Admin SDK** for user creation in production
3. **Validate caller permissions** in Cloud Functions
4. **Use HTTPS callable functions** for authenticated calls
5. **Implement rate limiting** to prevent abuse

## 📚 Resources

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [User Management Admin](https://firebase.google.com/docs/auth/admin/manage-users)

---

**Current Status:** ⚠️ Development mode - requires Cloud Functions for production use
