-- Migration: Add separate discount columns to sales table
-- Date: 2025-09-30

-- Add fixed discount amount column (in PKR)
ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'Fixed discount amount in PKR';

-- Add percentage discount column
ALTER TABLE sales ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentage discount (0-100)';

-- Add subtotal column to track original amount before discount
ALTER TABLE sales ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0 COMMENT 'Subtotal before discount';

-- Add discount type enum to track which type of discount was applied
ALTER TABLE sales ADD COLUMN discount_type ENUM('none', 'amount', 'percentage') DEFAULT 'none' COMMENT 'Type of discount applied';

-- Add index for better performance when querying by discount type
CREATE INDEX idx_sales_discount_type ON sales(discount_type);

-- Update existing records to set subtotal equal to total_amount for historical data
UPDATE sales SET subtotal = total_amount WHERE subtotal = 0;