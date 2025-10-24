// Application Configuration
// Firebase-based configuration for StoreFlow

export const APP_CONFIG = {
  name: 'StoreFlow',
  version: '2.0.0',
  description: 'Modern Inventory Management System',
  
  // Firebase configuration is now in firebase.js
  
  // Application settings
  pagination: {
    defaultPageSize: 25,
    pageSizes: [10, 25, 50, 100]
  },
  
  // Business rules
  business: {
    lowStockThreshold: 10,
    maxItemsPerSale: 100,
    defaultCustomerType: 'retail'
  },
  
  // UI settings
  ui: {
    theme: 'light',
    currency: 'PKR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h'
  }
};

export default APP_CONFIG;
