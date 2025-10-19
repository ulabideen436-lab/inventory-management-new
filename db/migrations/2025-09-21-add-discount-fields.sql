-- Migration: Add discount_type and discount_value to sale_items
ALTER TABLE sale_items ADD COLUMN discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage';
ALTER TABLE sale_items ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN original_price DECIMAL(10,2) DEFAULT 0;

-- Update existing records to use the discount column value as discount_value
UPDATE sale_items SET discount_value = discount WHERE discount > 0;