-- Migration: Add item-level discount columns to sale_items table
-- Date: 2025-09-30
-- Description: Adds columns to store individual item discount information

-- Add item discount type column
ALTER TABLE sale_items 
ADD COLUMN item_discount_type ENUM('none', 'percentage', 'amount') DEFAULT 'none' 
AFTER price;

-- Add item discount value column (stores the percentage or amount entered)
ALTER TABLE sale_items 
ADD COLUMN item_discount_value DECIMAL(10,2) DEFAULT 0.00 
AFTER item_discount_type;

-- Add item discount amount column (stores calculated discount amount)
ALTER TABLE sale_items 
ADD COLUMN item_discount_amount DECIMAL(10,2) DEFAULT 0.00 
AFTER item_discount_value;

-- Add original price column (stores price before any discount)
ALTER TABLE sale_items 
ADD COLUMN original_price DECIMAL(10,2) DEFAULT 0.00 
AFTER item_discount_amount;

-- Add final price column (stores price after discount applied)
ALTER TABLE sale_items 
ADD COLUMN final_price DECIMAL(10,2) DEFAULT 0.00 
AFTER original_price;

-- Add index for better performance when querying by discount type
CREATE INDEX idx_sale_items_discount_type ON sale_items(item_discount_type);

-- Add index for querying discounted items
CREATE INDEX idx_sale_items_discount_amount ON sale_items(item_discount_amount);

-- Update existing records to set original_price and final_price equal to current price
UPDATE sale_items 
SET original_price = price, final_price = price 
WHERE original_price = 0.00 AND final_price = 0.00;