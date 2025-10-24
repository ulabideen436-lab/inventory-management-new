// Customer service for Firebase Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase.js';

class CustomerService {
  constructor() {
    this.collectionName = 'customers';
    this.collection = collection(db, this.collectionName);
  }

  // Get all customers
  async getAllCustomers() {
    try {
      const querySnapshot = await getDocs(this.collection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching customers: ${error.message}`);
    }
  }

  // Get customer by ID
  async getCustomerById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error fetching customer: ${error.message}`);
    }
  }

  // Add new customer
  async addCustomer(customerData) {
    try {
      const docRef = await addDoc(this.collection, {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw new Error(`Error adding customer: ${error.message}`);
    }
  }

  // Update customer
  async updateCustomer(id, customerData) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...customerData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
  }

  // Delete customer
  async deleteCustomer(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      throw new Error(`Error deleting customer: ${error.message}`);
    }
  }

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const q = query(
        this.collection,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error searching customers: ${error.message}`);
    }
  }

  // Get customers by type
  async getCustomersByType(type) {
    try {
      const q = query(
        this.collection,
        where('type', '==', type),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching customers by type: ${error.message}`);
    }
  }

  // Listen to customers changes
  onCustomersSnapshot(callback) {
    return onSnapshot(this.collection, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(customers);
    });
  }

  // Update customer balance
  async updateCustomerBalance(id, balance) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        balance,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating customer balance: ${error.message}`);
    }
  }
}

export default new CustomerService();