-- Fix purchase_items table to match products table schema
-- products.id is VARCHAR(12), so purchase_items.product_id should also be VARCHAR(12)

ALTER TABLE purchase_items MODIFY COLUMN product_id VARCHAR(12) NOT NULL;