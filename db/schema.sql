-- StoreFlow Professional MySQL Schema

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('owner', 'cashier') NOT NULL
);

CREATE TABLE products (
    id VARCHAR(12) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    design_no VARCHAR(50),
    location VARCHAR(50),
    uom VARCHAR(20) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    total_sold INT DEFAULT 0,
    category VARCHAR(50) DEFAULT NULL
);

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    balance DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cashier_id INT,
    customer_id INT,
    discount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand_name VARCHAR(100),
    contact_info VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_cost DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    product_id INT,
    quantity INT NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    amount DECIMAL(10,2) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
