// Product service for Firebase Firestore
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
  limit,
  startAfter,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase.js';

class ProductService {
  constructor() {
    this.collectionName = 'products';
    this.collection = collection(db, this.collectionName);
  }

  // Get all products
  async getAllProducts() {
    try {
      const querySnapshot = await getDocs(this.collection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }

  // Get product by ID
  async getProductById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }

  // Add new product
  async addProduct(productData) {
    try {
      const docRef = await addDoc(this.collection, {
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw new Error(`Error adding product: ${error.message}`);
    }
  }

  // Update product
  async updateProduct(id, productData) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  // Delete product
  async deleteProduct(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  // Search products
  async searchProducts(searchTerm) {
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
      throw new Error(`Error searching products: ${error.message}`);
    }
  }

  // Get products by category
  async getProductsByCategory(category) {
    try {
      const q = query(
        this.collection,
        where('category', '==', category),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching products by category: ${error.message}`);
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold = 10) {
    try {
      const q = query(
        this.collection,
        where('stock', '<=', threshold),
        orderBy('stock')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error fetching low stock products: ${error.message}`);
    }
  }

  // Listen to products changes
  onProductsSnapshot(callback) {
    return onSnapshot(this.collection, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    });
  }

  // Bulk add products
  async bulkAddProducts(products) {
    try {
      const promises = products.map(product => 
        addDoc(this.collection, {
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
      const results = await Promise.all(promises);
      return results.map(doc => doc.id);
    } catch (error) {
      throw new Error(`Error bulk adding products: ${error.message}`);
    }
  }
}

export default new ProductService();