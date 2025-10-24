// Authentication service for Firebase
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

class AuthService {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      return { user: userCredential.user, userData };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign up user with email and password (public registration)
  async signUp(email, password, displayName, role = 'cashier') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      // Public signup only allows cashier role
      const userData = {
        displayName,
        email,
        role: 'cashier', // Force cashier role for public signup
        createdAt: new Date(),
        isActive: true,
        provider: 'email'
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);

      return { user, userData };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Create user by owner (can assign any role)
  // Note: This signs out the current admin temporarily to create the new user
  async createUserByOwner(email, password, displayName, role = 'cashier') {
    try {
      // Check if current user is owner
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const currentUserData = await this.getUserData(currentUser.uid);
      if (currentUserData?.role !== 'owner') {
        throw new Error('Permission denied. Only owners can create users.');
      }

      // Store current user info to re-login later
      const currentUserEmail = currentUser.email;
      
      // Note: In production, you should use Firebase Admin SDK via Cloud Functions
      // This is a workaround for development
      const warningMessage = 'Creating users requires Firebase Admin SDK. For now, creating user with limited functionality.';
      console.warn(warningMessage);

      // Create user document directly without authentication
      // In production, this should be done via Cloud Functions with Admin SDK
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData = {
        displayName,
        email,
        role,
        createdAt: new Date(),
        isActive: true,
        provider: 'email',
        createdBy: currentUser.uid,
        // Temporary password hash (in production, use Admin SDK)
        tempPassword: password, // THIS IS NOT SECURE - USE CLOUD FUNCTIONS IN PRODUCTION
        needsPasswordSetup: true
      };
      
      await setDoc(doc(db, 'users', newUserId), userData);

      return { 
        user: { uid: newUserId, email, displayName }, 
        userData,
        warning: 'User created in database. They need to complete registration via email link (requires Cloud Functions setup).'
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user role (admin only)
  async updateUserRole(uid, newRole) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const currentUserData = await this.getUserData(currentUser.uid);
      if (currentUserData?.role !== 'owner') {
        throw new Error('Permission denied. Only owners can update roles.');
      }

      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
      return { success: true, message: 'User role updated successfully' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Handle Firebase auth errors
  handleAuthError(error) {
    const errorMessages = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account already exists with this email',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/cancelled-popup-request': 'Only one popup request is allowed at a time',
      'auth/operation-not-allowed': 'This sign-in method is not enabled',
    };

    const message = errorMessages[error.code] || error.message || 'Authentication failed';
    return new Error(message);
  }
}

export default new AuthService();