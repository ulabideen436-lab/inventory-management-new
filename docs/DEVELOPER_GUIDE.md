# StoreFlow Professional - Developer Guide

## 🛠 Developer Documentation

### 📋 Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Code Architecture](#code-architecture)
4. [API Reference](#api-reference)
5. [Database Design](#database-design)
6. [Testing Guide](#testing-guide)
7. [Deployment Guide](#deployment-guide)
8. [Contributing Guidelines](#contributing-guidelines)

---

## 🚀 Development Environment Setup

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- Git
- VS Code (recommended)

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/storeflow-professional.git
cd storeflow-professional

# Setup database
mysql -u root -p < db/schema.sql

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Install frontend dependencies  
cd ../frontend
npm install

# Start development servers
npm run dev:all  # Starts both frontend and backend
```

### Development Scripts
```bash
# Backend
npm run dev          # Start with nodemon
npm run start        # Production start
npm run migrate      # Run database migrations
npm run test         # Run tests

# Frontend  
npm start            # Development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Code linting
```

---

## 📁 Project Structure

```
storeflow-professional/
├── backend/                    # Node.js/Express backend
│   ├── src/                   # Source code
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   └── index.js          # Main server file
│   ├── migrations/           # Database migrations
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── knexfile.js          # Database configuration
├── frontend/                 # React frontend
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── build/              # Production build
│   └── package.json
├── db/                      # Database files
│   ├── schema.sql          # Database schema
│   └── migrations/         # SQL migrations
├── docs/                    # Documentation
├── tests/                   # Integration tests
├── docker-compose.yml       # Docker configuration
└── README.md
```

### Key Directories Explained

**Backend Structure:**
- `controllers/`: Handle HTTP requests and business logic
- `middleware/`: Authentication, validation, error handling
- `models/`: Database interaction and data models
- `routes/`: API endpoint definitions
- `utils/`: Helper functions and utilities

**Frontend Structure:**
- `components/`: Reusable React components
- `pages/`: Top-level page components
- `styles/`: CSS and styling files
- `utils/`: Client-side utilities and helpers

---

## 🏗 Code Architecture

### Backend Architecture

#### **MVC Pattern**
```javascript
// Model (models/db.js)
class Product {
  static async findAll() {
    return await db('products').select('*');
  }
  
  static async create(productData) {
    return await db('products').insert(productData);
  }
}

// Controller (controllers/productsController.js)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Route (routes/products.js)
router.get('/products', auth, getProducts);
```

#### **Middleware Stack**
```javascript
// Authentication middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
};
```

### Frontend Architecture

#### **Component Structure**
```javascript
// Functional component with hooks
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

#### **State Management Pattern**
```javascript
// Custom hook for API calls
const useApi = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

---

## 🔌 API Reference

### Authentication Endpoints

#### **POST /auth/login**
```javascript
// Request
{
  "username": "admin",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "owner"
  }
}
```

#### **POST /auth/register** (Owner only)
```javascript
// Request
{
  "username": "cashier1",
  "password": "secure123",
  "role": "cashier"
}

// Response
{
  "message": "User created successfully",
  "userId": 2
}
```

### Product Management

#### **GET /products**
```javascript
// Query parameters
?category=electronics&limit=50&offset=0&search=phone

// Response
[
  {
    "id": "PROD001",
    "name": "iPhone 13",
    "brand": "Apple",
    "retail_price": 999.99,
    "wholesale_price": 850.00,
    "stock_quantity": 25,
    "category": "electronics"
  }
]
```

#### **POST /products**
```javascript
// Request
{
  "id": "PROD002",
  "name": "Samsung Galaxy S21",
  "brand": "Samsung",
  "retail_price": 899.99,
  "wholesale_price": 750.00,
  "stock_quantity": 30,
  "category": "electronics",
  "location": "A1-B2"
}

// Response
{
  "message": "Product created successfully",
  "product": { ... }
}
```

#### **PUT /products/:id**
```javascript
// Request
{
  "retail_price": 949.99,
  "stock_quantity": 35
}

// Response
{
  "message": "Product updated successfully"
}
```

#### **DELETE /products/:id**
```javascript
// Response
{
  "message": "Product deleted successfully"
}
```

### Sales Management

#### **POST /sales**
```javascript
// Request
{
  "customer_id": 1,
  "items": [
    {
      "product_id": "PROD001",
      "quantity": 2,
      "price": 999.99,
      "discount": 50.00
    }
  ],
  "discount": 0,
  "payment_method": "cash"
}

// Response
{
  "sale_id": 123,
  "total_amount": 1949.98,
  "message": "Sale completed successfully"
}
```

#### **GET /sales**
```javascript
// Query parameters
?from=2024-01-01&to=2024-12-31&status=completed&customer_id=1

// Response
[
  {
    "id": 123,
    "date": "2024-09-18T10:30:00Z",
    "customer_id": 1,
    "total_amount": 1949.98,
    "status": "completed",
    "items": [...]
  }
]
```

### Customer Management

#### **GET /customers**
```javascript
// Response
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "balance": 150.00,
    "total_purchases": 2500.00,
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

#### **POST /customers**
```javascript
// Request
{
  "name": "Jane Smith",
  "brand_name": "Smith Enterprises",
  "contact": "jane@example.com",
  "phone": "+1987654321",
  "address": "123 Business St",
  "opening_balance": 0
}

// Response
{
  "customer_id": 2,
  "message": "Customer created successfully"
}
```

### Reporting Endpoints

#### **GET /reports/sales-summary**
```javascript
// Query parameters
?from=2024-09-01&to=2024-09-30&group_by=day

// Response
{
  "total_sales": 15000.00,
  "total_transactions": 75,
  "average_transaction": 200.00,
  "daily_breakdown": [
    {
      "date": "2024-09-01",
      "sales": 500.00,
      "transactions": 3
    }
  ]
}
```

#### **GET /reports/inventory-status**
```javascript
// Response
{
  "total_products": 150,
  "total_value": 75000.00,
  "low_stock_items": 5,
  "out_of_stock_items": 2,
  "categories": [
    {
      "category": "electronics",
      "count": 50,
      "value": 45000.00
    }
  ]
}
```

### WebSocket Events

#### **Real-time Sales Updates**
```javascript
// Client connection
const ws = new WebSocket('ws://localhost:8080');

// Listen for sale events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'SALE_COMPLETED') {
    updateDashboard(data.sale);
  }
};

// Server event
{
  "type": "SALE_COMPLETED",
  "sale": {
    "id": 123,
    "total_amount": 1949.98,
    "timestamp": "2024-09-18T10:30:00Z"
  }
}
```

#### **Inventory Updates**
```javascript
// Low stock alert
{
  "type": "LOW_STOCK_ALERT",
  "product": {
    "id": "PROD001",
    "name": "iPhone 13",
    "current_stock": 2,
    "reorder_level": 5
  }
}
```

---

## 🗄 Database Design

### Entity Relationship Diagram

```
Users           Products        Sales
┌─────────┐    ┌─────────────┐  ┌─────────────┐
│ id (PK) │    │ id (PK)     │  │ id (PK)     │
│ username│    │ name        │  │ date        │
│ password│    │ brand       │  │ cashier_id  │
│ role    │    │ retail_price│  │ customer_id │
└─────────┘    │ stock_qty   │  │ total_amount│
               └─────────────┘  └─────────────┘
                      │               │
                      └───────┬───────┘
                              │
                    ┌─────────────────┐
                    │   Sale_Items    │
                    │ id (PK)         │
                    │ sale_id (FK)    │
                    │ product_id (FK) │
                    │ quantity        │
                    │ price           │
                    └─────────────────┘
```

### Table Specifications

#### **users**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('owner', 'cashier') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_username (username),
    INDEX idx_role (role)
);
```

#### **products**
```sql
CREATE TABLE products (
    id VARCHAR(12) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    design_no VARCHAR(50),
    location VARCHAR(50),
    uom VARCHAR(20) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 5,
    total_sold INT DEFAULT 0,
    category VARCHAR(50),
    barcode VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_brand (brand),
    INDEX idx_category (category),
    INDEX idx_barcode (barcode),
    INDEX idx_stock_quantity (stock_quantity)
);
```

#### **sales**
```sql
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cashier_id INT,
    customer_id INT,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'check', 'digital') DEFAULT 'cash',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    
    INDEX idx_date (date),
    INDEX idx_cashier_id (cashier_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status)
);
```

#### **sale_items**
```sql
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id VARCHAR(12) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    
    INDEX idx_sale_id (sale_id),
    INDEX idx_product_id (product_id)
);
```

### Database Optimization

#### **Indexes for Performance**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_sales_date_cashier ON sales(date, cashier_id);
CREATE INDEX idx_sales_customer_date ON sales(customer_id, date);
CREATE INDEX idx_products_category_stock ON products(category, stock_quantity);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_products_search ON products(name, brand, description);
CREATE FULLTEXT INDEX idx_customers_search ON customers(name, brand_name, contact);
```

#### **Query Optimization Examples**
```sql
-- Efficient sales report query
SELECT 
    DATE(s.date) as sale_date,
    COUNT(*) as transaction_count,
    SUM(s.total_amount) as daily_total,
    AVG(s.total_amount) as avg_transaction
FROM sales s 
WHERE s.date >= '2024-09-01' 
    AND s.date < '2024-10-01'
    AND s.status = 'completed'
GROUP BY DATE(s.date)
ORDER BY sale_date;

-- Top selling products query
SELECT 
    p.name,
    p.brand,
    SUM(si.quantity) as total_sold,
    SUM(si.line_total) as total_revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
    AND s.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id, p.name, p.brand
ORDER BY total_sold DESC
LIMIT 10;
```

---

## 🧪 Testing Guide

### Test Structure
```
tests/
├── unit/                # Unit tests
│   ├── controllers/     # Controller tests
│   ├── models/         # Model tests
│   └── utils/          # Utility tests
├── integration/        # Integration tests
│   ├── api/           # API endpoint tests
│   └── database/      # Database tests
├── e2e/               # End-to-end tests
│   ├── auth/          # Authentication flows
│   ├── sales/         # Sales workflows
│   └── inventory/     # Inventory management
└── fixtures/          # Test data
```

### Unit Testing

#### **Controller Tests**
```javascript
// tests/unit/controllers/productsController.test.js
const request = require('supertest');
const app = require('../../../src/app');
const db = require('../../../src/models/db');

describe('Products Controller', () => {
  beforeEach(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });

  afterEach(async () => {
    await db.migrate.rollback();
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=electronics')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.every(p => p.category === 'electronics')).toBe(true);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const productData = {
        id: 'TEST001',
        name: 'Test Product',
        retail_price: 99.99,
        uom: 'pcs'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.message).toBe('Product created successfully');
    });

    it('should validate required fields', async () => {
      const invalidProduct = { name: 'Test' };

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidProduct)
        .expect(400);
    });
  });
});
```

#### **Model Tests**
```javascript
// tests/unit/models/Product.test.js
const Product = require('../../../src/models/Product');
const db = require('../../../src/models/db');

describe('Product Model', () => {
  beforeEach(async () => {
    await db.migrate.latest();
  });

  afterEach(async () => {
    await db.migrate.rollback();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        id: 'TEST001',
        name: 'Test Product',
        retail_price: 99.99,
        uom: 'pcs'
      };

      const product = await Product.create(productData);
      expect(product.id).toBe('TEST001');
      
      const found = await Product.findById('TEST001');
      expect(found.name).toBe('Test Product');
    });
  });

  describe('updateStock', () => {
    it('should update product stock quantity', async () => {
      const product = await Product.create({
        id: 'TEST001',
        name: 'Test Product',
        retail_price: 99.99,
        stock_quantity: 10,
        uom: 'pcs'
      });

      await Product.updateStock('TEST001', 15);
      
      const updated = await Product.findById('TEST001');
      expect(updated.stock_quantity).toBe(15);
    });
  });
});
```

### Integration Testing

#### **API Integration Tests**
```javascript
// tests/integration/api/sales.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('Sales API Integration', () => {
  let authToken;
  let customerId;
  let productId;

  beforeAll(async () => {
    // Setup test data
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password' });
    
    authToken = loginResponse.body.token;

    // Create test customer and product
    const customerResponse = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Customer',
        brand_name: 'Test Brand',
        contact: 'test@example.com'
      });
    
    customerId = customerResponse.body.customer_id;

    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        id: 'TEST001',
        name: 'Test Product',
        retail_price: 100.00,
        stock_quantity: 50,
        uom: 'pcs'
      });
    
    productId = 'TEST001';
  });

  describe('Complete Sales Flow', () => {
    it('should process a complete sale', async () => {
      // Create sale
      const saleData = {
        customer_id: customerId,
        items: [
          {
            product_id: productId,
            quantity: 2,
            price: 100.00
          }
        ]
      };

      const saleResponse = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect(201);

      const saleId = saleResponse.body.sale_id;

      // Verify sale was created
      const getSaleResponse = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getSaleResponse.body.total_amount).toBe(200.00);

      // Verify stock was reduced
      const productResponse = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(productResponse.body.stock_quantity).toBe(48);
    });
  });
});
```

### E2E Testing with Puppeteer

#### **End-to-End Tests**
```javascript
// tests/e2e/sales-workflow.test.js
const puppeteer = require('puppeteer');

describe('Sales Workflow E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete a sale workflow', async () => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.type('input[name="username"]', 'testuser');
    await page.type('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Navigate to sales
    await page.click('a[href="/sales"]');
    await page.waitForSelector('.sales-container');

    // Start new sale
    await page.click('button[data-testid="new-sale"]');
    
    // Add product
    await page.type('input[data-testid="product-search"]', 'Test Product');
    await page.waitForSelector('.product-suggestion');
    await page.click('.product-suggestion:first-child');

    // Verify product was added
    const productName = await page.$eval('.sale-item .product-name', 
      el => el.textContent);
    expect(productName).toBe('Test Product');

    // Complete sale
    await page.click('button[data-testid="complete-sale"]');
    await page.waitForSelector('.sale-success');

    // Verify success message
    const successMessage = await page.$eval('.sale-success', 
      el => el.textContent);
    expect(successMessage).toContain('Sale completed successfully');
  });
});
```

### Test Data Management

#### **Database Seeding**
```javascript
// seeds/test-data.js
exports.seed = async function(knex) {
  // Clear existing data
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('products').del();
  await knex('customers').del();
  await knex('users').del();

  // Insert test users
  await knex('users').insert([
    {
      id: 1,
      username: 'testowner',
      password: '$2b$12$hashedpassword',
      role: 'owner'
    },
    {
      id: 2,
      username: 'testcashier',
      password: '$2b$12$hashedpassword',
      role: 'cashier'
    }
  ]);

  // Insert test products
  await knex('products').insert([
    {
      id: 'TEST001',
      name: 'Test Product 1',
      brand: 'Test Brand',
      retail_price: 99.99,
      wholesale_price: 80.00,
      stock_quantity: 100,
      category: 'electronics',
      uom: 'pcs'
    }
  ]);

  // Insert test customers
  await knex('customers').insert([
    {
      id: 1,
      name: 'Test Customer',
      brand_name: 'Test Company',
      contact: 'test@example.com',
      phone: '1234567890'
    }
  ]);
};
```

### Running Tests

#### **Test Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

#### **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000
};
```

### Performance Testing

#### **Load Testing with Artillery**
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/products"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/sales"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            customer_id: 1
            items:
              - product_id: "TEST001"
                quantity: 1
                price: 99.99
```

---

## 🚀 Deployment Guide

### Production Environment Setup

#### **Server Requirements**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB SSD minimum
- **Network**: 100Mbps connection

#### **Software Stack**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install pm2 -g

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

### Database Setup

#### **Production Database Configuration**
```sql
-- Create production database and user
CREATE DATABASE storeflow_production;
CREATE USER 'storeflow_prod'@'localhost' IDENTIFIED BY 'secure_production_password';
GRANT ALL PRIVILEGES ON storeflow_production.* TO 'storeflow_prod'@'localhost';

-- Configure MySQL for production
-- Edit /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
max_connections = 200
query_cache_size = 256M
tmp_table_size = 512M
max_heap_table_size = 512M
```

#### **Database Backup Script**
```bash
#!/bin/bash
# backup-database.sh

DB_NAME="storeflow_production"
DB_USER="storeflow_prod"
DB_PASS="secure_production_password"
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/storeflow_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/storeflow_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "storeflow_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: storeflow_$DATE.sql.gz"
```

### Application Deployment

#### **Backend Deployment**
```bash
# Clone repository
git clone https://github.com/yourusername/storeflow-professional.git
cd storeflow-professional

# Install dependencies
cd backend
npm ci --production

# Set up environment
cp .env.example .env.production
nano .env.production
```

**Production Environment Variables:**
```env
# Production .env
NODE_ENV=production
PORT=5000
WS_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=storeflow_production
DB_USER=storeflow_prod
DB_PASSWORD=secure_production_password
DB_CONNECTION_LIMIT=10

# Security
JWT_SECRET=your_super_secure_jwt_secret_64_characters_minimum
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/storeflow/app.log
```

#### **PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'storeflow-api',
      script: 'src/index.js',
      cwd: '/opt/storeflow/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/storeflow/api-error.log',
      out_file: '/var/log/storeflow/api-out.log',
      log_file: '/var/log/storeflow/api.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 3000,
      autorestart: true,
      watch: false
    },
    {
      name: 'storeflow-websocket',
      script: 'src/websocket-server.js',
      cwd: '/opt/storeflow/backend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        WS_PORT: 8080
      },
      error_file: '/var/log/storeflow/ws-error.log',
      out_file: '/var/log/storeflow/ws-out.log'
    }
  ]
};
```

#### **Frontend Build and Deployment**
```bash
# Build frontend
cd frontend
npm ci
npm run build

# Copy build to web server
sudo cp -r build/* /var/www/storeflow/
sudo chown -R www-data:www-data /var/www/storeflow/
```

### Web Server Configuration

#### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/storeflow
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        root /var/www/storeflow;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Proxy
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

### SSL Certificate Setup

#### **Let's Encrypt SSL**
```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring and Logging

#### **System Monitoring Setup**
```bash
# Install system monitoring tools
sudo apt install htop iotop nethogs

# Setup log rotation
sudo nano /etc/logrotate.d/storeflow
```

**Log Rotation Configuration:**
```
/var/log/storeflow/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### **Application Monitoring**
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Monitor with PM2 Plus (optional)
pm2 plus
pm2 link <secret_key> <public_key>
```

### Backup Strategy

#### **Automated Backup Script**
```bash
#!/bin/bash
# full-backup.sh

BACKUP_DIR="/var/backups/storeflow"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Database backup
mysqldump -u storeflow_prod -p$DB_PASSWORD storeflow_production | gzip > $BACKUP_DIR/$DATE/database.sql.gz

# Application backup
tar -czf $BACKUP_DIR/$DATE/application.tar.gz /opt/storeflow

# Configuration backup
cp -r /etc/nginx/sites-available/storeflow $BACKUP_DIR/$DATE/
cp /opt/storeflow/backend/.env.production $BACKUP_DIR/$DATE/

# Upload to cloud storage (optional)
# aws s3 sync $BACKUP_DIR/$DATE s3://your-backup-bucket/storeflow/$DATE

# Cleanup old backups
find $BACKUP_DIR -type d -mtime +$RETENTION_DAYS -exec rm -rf {} +

echo "Backup completed: $DATE"
```

### Security Hardening

#### **Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # MySQL (if needed)
```

#### **System Security**
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Performance Optimization

#### **Database Optimization**
```sql
-- MySQL performance tuning
SET GLOBAL innodb_buffer_pool_size = 2147483648;  -- 2GB
SET GLOBAL query_cache_size = 268435456;  -- 256MB
SET GLOBAL max_connections = 200;

-- Create performance indexes
CREATE INDEX idx_sales_date_status ON sales(date, status);
CREATE INDEX idx_products_stock_category ON products(stock_quantity, category);
```

#### **Application Optimization**
```javascript
// Enable compression middleware
app.use(compression({
  level: 6,
  threshold: 100 * 1000,  // Only compress > 100KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Enable caching
const cache = require('memory-cache');
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cached = cache.get(key);
    if (cached) {
      res.send(cached);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};
```

### Deployment Checklist

- [ ] Server provisioned and secured
- [ ] Database installed and configured
- [ ] SSL certificate installed
- [ ] Application deployed and running
- [ ] Nginx configured and tested
- [ ] PM2 process manager configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimization applied
- [ ] Health checks passing
- [ ] Documentation updated

---

*This developer guide provides comprehensive information for setting up, developing, testing, and deploying StoreFlow Professional. For additional support, please refer to the project repository or contact the development team.*