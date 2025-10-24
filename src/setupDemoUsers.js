// Firebase Demo Users Setup Script
// This script creates demo users in Firebase Authentication and Firestore
// Run this once to set up demo accounts for testing

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

const demoUsers = [
  {
    email: 'owner@storeflow.com',
    password: 'owner123',
    displayName: 'Owner Demo',
    role: 'owner'
  },
  {
    email: 'cashier@storeflow.com',
    password: 'cashier123',
    displayName: 'Cashier Demo',
    role: 'cashier'
  }
];

async function createDemoUsers() {
  console.log('🚀 Setting up demo users...\n');

  for (const userData of demoUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: userData.displayName
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
        isActive: true,
        provider: 'email'
      });

      console.log(`✅ Successfully created: ${userData.email} (${userData.role})`);
      console.log(`   UID: ${user.uid}\n`);

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User already exists: ${userData.email}\n`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message, '\n');
      }
    }
  }

  console.log('\n✨ Demo users setup complete!');
  console.log('\nYou can now log in with:');
  console.log('👤 Owner: owner@storeflow.com / owner123');
  console.log('👤 Cashier: cashier@storeflow.com / cashier123');
}

// Run the setup
createDemoUsers()
  .then(() => {
    console.log('\n🎉 Setup finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
