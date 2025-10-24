// Sales service for Firebase Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';

class SalesService {
  constructor() {
    this.collectionName = 'sales';
    this.collection = collection(db, this.collectionName);
  }

  // Create new sale
  async createSale(saleData) {
    const batch = writeBatch(db);
    
    try {
      // Add sale document
      const saleRef = doc(this.collection);
      batch.set(saleRef, {
        ...saleData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update product stock for each item
      for (const item of saleData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock;
          const newStock = currentStock - item.quantity;
          
          batch.update(productRef, {
            stock: newStock,
            updatedAt: new Date()
          });
        }
      }

      await batch.commit();
      return saleRef.id;
    } catch (error) {
      throw new Error(`Error creating sale: ${error.message}`);
    }
  }

  // Get all sales
  async getAllSales() {
    try {
      const q = query(this.collection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching sales: ${error.message}`);
    }
  }

  // Get sale by ID
  async getSaleById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error fetching sale: ${error.message}`);
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate) {
    try {
      const q = query(
        this.collection,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching sales by date range: ${error.message}`);
    }
  }

  // Get sales by customer
  async getSalesByCustomer(customerId) {
    try {
      const q = query(
        this.collection,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching sales by customer: ${error.message}`);
    }
  }

  // Get today's sales
  async getTodaysSales() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const q = query(
        this.collection,
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<', endOfDay),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching today's sales: ${error.message}`);
    }
  }

  // Get sales statistics
  async getSalesStats(startDate, endDate) {
    try {
      const sales = await this.getSalesByDateRange(startDate, endDate);
      
      const stats = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
        totalItems: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        averageSale: 0
      };

      stats.averageSale = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;

      return stats;
    } catch (error) {
      throw new Error(`Error fetching sales statistics: ${error.message}`);
    }
  }

  // Listen to sales changes
  onSalesSnapshot(callback) {
    const q = query(this.collection, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sales);
    });
  }

  // Update sale status
  async updateSaleStatus(id, status) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating sale status: ${error.message}`);
    }
  }
}

export default new SalesService();