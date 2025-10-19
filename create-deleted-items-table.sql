-- Migration to create deleted_items table for tracking all deleted records
-- This table will store the original data of deleted items for restoration purposes

CREATE TABLE deleted_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type ENUM('product', 'customer', 'supplier', 'sale', 'user', 'purchase') NOT NULL,
    item_id VARCHAR(50) NOT NULL, -- Can handle both INT and VARCHAR primary keys
    original_data JSON NOT NULL, -- Store the complete original record
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by INT NOT NULL, -- User who performed the deletion
    deletion_reason VARCHAR(500) DEFAULT NULL,
    can_restore BOOLEAN DEFAULT TRUE,
    INDEX idx_item_type (item_type),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_deleted_by (deleted_by),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Add deleted_at columns to main tables for soft delete support
ALTER TABLE products ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE customers ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE suppliers ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE sales ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE purchases ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Add indexes for performance on deleted_at columns
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX idx_sales_deleted_at ON sales(deleted_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_purchases_deleted_at ON purchases(deleted_at);