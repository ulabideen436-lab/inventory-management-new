-- Migration: Add status to sales and discount to sale_items
ALTER TABLE sales ADD COLUMN status ENUM('pending','completed') DEFAULT 'pending';
ALTER TABLE sale_items ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;