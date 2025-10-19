-- Manual Migration Script for Purchase and Payment Enhancements
-- Run this in your MySQL client for the 'storeflow' database

USE storeflow;

-- Add fields to purchases table
-- (These will fail gracefully if columns already exist)

-- Add description field to purchases
SELECT 'Adding description to purchases table...' as status;
ALTER TABLE purchases ADD COLUMN description TEXT;

-- Add supplier invoice ID field to purchases
SELECT 'Adding supplier_invoice_id to purchases table...' as status;
ALTER TABLE purchases ADD COLUMN supplier_invoice_id VARCHAR(100);

-- Add delivery method field to purchases
SELECT 'Adding delivery_method to purchases table...' as status;
ALTER TABLE purchases ADD COLUMN delivery_method VARCHAR(100);

-- Add payment method field to payments
SELECT 'Adding payment_method to payments table...' as status;
ALTER TABLE payments ADD COLUMN payment_method VARCHAR(100);

-- Add payment date field to payments
SELECT 'Adding payment_date to payments table...' as status;
ALTER TABLE payments ADD COLUMN payment_date DATE;

SELECT 'Migration completed! Please verify the new columns exist.' as status;

-- Verify the new columns exist
DESCRIBE purchases;
DESCRIBE payments;