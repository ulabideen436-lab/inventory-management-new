-- Migration: Create customer_payments table
-- This table tracks payments received from customers

CREATE TABLE customer_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) DEFAULT 'Payment received',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);