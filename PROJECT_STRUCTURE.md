# StoreFlow Project Structure

## 📁 Root Directory
```
storeflow/
├── 📄 README.md                    # Project documentation
├── 📄 package.json                 # Dependencies and scripts
├── 📄 package-lock.json             # Dependency lock file
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .firebaserc                  # Firebase project configuration
├── 📄 firebase.json                # Firebase hosting and rules config
├── 📁 public/                      # Static assets
├── 📁 src/                         # Source code
├── 📁 build/                       # Production build output
├── 📁 docs/                        # Documentation
├── 📁 firebase/                    # Firebase configuration files
└── 📁 node_modules/                # Dependencies (ignored in git)
```

## 📁 Source Code Structure (`src/`)
```
src/
├── 📄 App.js                       # Main application component
├── 📄 index.js                     # Application entry point
├── 📁 components/                  # Reusable UI components
│   ├── 📄 AddCustomer.js
│   ├── 📄 AddProduct.js
│   ├── 📄 AddSale.js
│   ├── 📄 CashierPOS.js
│   ├── 📄 CashierPOS_Enhanced.js
│   ├── 📄 Customers.js
│   ├── 📄 Dashboard.js
│   ├── 📄 Login.js
│   ├── 📄 Products.js
│   ├── 📄 Reports.js
│   ├── 📄 Sales.js
│   └── 📄 Suppliers.js
├── 📁 pages/                       # Main application pages
│   ├── 📄 AdminPage.js
│   ├── 📄 CashierPage.js
│   └── 📄 OwnerPage.js
├── 📁 hooks/                       # Custom React hooks
│   └── 📄 usePersistentState.js
├── 📁 context/                     # React Context providers
│   └── 📄 AuthContext.js
├── 📁 services/                    # Firebase services
│   ├── 📄 firebase.js              # Firebase initialization
│   ├── 📄 authService.js           # Authentication service
│   ├── 📄 productService.js        # Product CRUD operations
│   ├── 📄 salesService.js          # Sales management
│   └── 📄 customerService.js       # Customer management
├── 📁 utils/                       # Utility functions
│   └── 📄 helpers.js
├── 📁 styles/                      # CSS styles
│   ├── 📄 App.css
│   ├── 📄 index.css
│   └── 📄 components.css
└── 📁 config/                      # Configuration files
    └── 📄 firebase.js              # Firebase configuration
```

## 📁 Firebase Configuration (`firebase/`)
```
firebase/
├── 📄 firestore.rules             # Firestore security rules
├── 📄 firestore.indexes.json      # Firestore indexes configuration
└── 📄 storage.rules               # Cloud Storage security rules
```

## 📁 Documentation (`docs/`)
```
docs/
├── 📄 getting-started.md          # Quick start guide
├── 📄 firebase-setup.md           # Detailed Firebase setup
├── 📄 api.md                      # API documentation
└── 📄 deployment.md               # Deployment guide
```

## 📁 Public Assets (`public/`)
```
public/
├── 📄 index.html                  # Main HTML template
├── 📄 manifest.json               # Web app manifest
├── 📄 favicon.ico                 # Application icon
└── 📄 robots.txt                  # Search engine crawling rules
```

## 🔧 Key Files Description

### Configuration Files
- **`package.json`**: Project dependencies, scripts, and metadata
- **`firebase.json`**: Firebase hosting, Firestore, and Storage configuration
- **`.firebaserc`**: Firebase project ID mapping
- **`.gitignore`**: Specifies files to ignore in version control

### Firebase Services
- **`src/services/firebase.js`**: Firebase app initialization and service exports
- **`src/services/authService.js`**: User authentication and authorization
- **`src/services/productService.js`**: Product CRUD operations with Firestore
- **`src/services/salesService.js`**: Sales processing and inventory updates
- **`src/services/customerService.js`**: Customer management operations

### Core Components
- **`src/App.js`**: Main application routing and layout
- **`src/components/CashierPOS.js`**: Point of sale interface
- **`src/components/Products.js`**: Product management with PDF export
- **`src/components/Dashboard.js`**: Analytics and overview dashboard

### Security & Rules
- **`firebase/firestore.rules`**: Database security rules with role-based access
- **`firebase/storage.rules`**: File upload security rules

## 🚀 Development Workflow

### Getting Started
1. **Setup**: `npm install` - Install dependencies
2. **Configure**: Update `src/config/firebase.js` with your Firebase config
3. **Develop**: `npm start` - Start development server
4. **Build**: `npm run build` - Create production build
5. **Deploy**: `firebase deploy` - Deploy to Firebase Hosting

### File Organization Principles

#### Components (`src/components/`)
- **Reusable UI components** that can be used across different pages
- Each component focuses on a specific business function
- Components handle their own state and UI logic

#### Services (`src/services/`)
- **Firebase integration layer** that abstracts database operations
- Each service handles a specific data domain (products, sales, customers)
- Provides consistent API for components to interact with Firebase

#### Pages (`src/pages/`)
- **High-level page components** that combine multiple components
- Role-based pages (Admin, Cashier, Owner) with different access levels
- Handle page-level routing and authentication checks

#### Hooks (`src/hooks/`)
- **Custom React hooks** for shared stateful logic
- Reusable across components for common functionality
- Clean separation of business logic from UI components

#### Context (`src/context/`)
- **Global state management** using React Context API
- Authentication state and user information
- Application-wide settings and configuration

## 📊 Data Structure

### Firestore Collections

#### Users Collection
```javascript
{
  displayName: "John Doe",
  email: "john@example.com",
  role: "admin" | "cashier" | "owner",
  createdAt: timestamp,
  isActive: boolean
}
```

#### Products Collection
```javascript
{
  name: "Product Name",
  category: "Category",
  retailPrice: number,
  wholesalePrice: number,
  stock: number,
  supplier: "Supplier Name",
  barcode: "optional",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Sales Collection
```javascript
{
  items: [
    {
      productId: "doc-id",
      name: "Product Name",
      quantity: number,
      price: number,
      total: number
    }
  ],
  customerId: "doc-id",
  customerType: "retail" | "wholesale",
  total: number,
  paymentMethod: "cash" | "card",
  createdAt: timestamp,
  status: "completed"
}
```

#### Customers Collection
```javascript
{
  name: "Customer Name",
  type: "retail" | "wholesale",
  phone: "optional",
  email: "optional",
  balance: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 Security Model

### Authentication
- **Firebase Authentication** with email/password
- Role-based access control (admin, cashier, owner)
- Protected routes based on user roles

### Database Security
- **Firestore Security Rules** enforce data access policies
- Users can only access data based on their role
- Real-time security enforcement at the database level

### File Storage
- **Cloud Storage Rules** control file upload permissions
- Image uploads restricted to authenticated users
- Document uploads restricted to admin/owner roles

## 📈 Scalability Considerations

### Performance
- **Code splitting** with React.lazy for smaller bundle sizes
- **Real-time listeners** for live data updates
- **Pagination** for large datasets
- **Indexes** for optimized Firestore queries

### Cost Optimization
- **Efficient queries** to minimize Firestore reads
- **Image compression** for storage optimization
- **Caching strategies** for frequently accessed data

### Monitoring
- **Firebase Analytics** for user behavior insights
- **Performance Monitoring** for app performance metrics
- **Error tracking** with Firebase Crashlytics

---

This structure provides a solid foundation for a modern, scalable inventory management system with Firebase as the backend service.