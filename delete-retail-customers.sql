-- Script to delete all retail type customers
-- This will:
-- 1. Show all retail customers
-- 2. Update sales to remove customer references (convert to walk-in)
-- 3. Delete retail customers

USE storeflow;

-- Show retail customers before deletion
SELECT '=== RETAIL CUSTOMERS TO BE DELETED ===' as info;
SELECT id, name, type, phone, address, balance 
FROM customers 
WHERE type = 'retail' OR type IS NULL OR type = '';

-- Count sales that will be affected
SELECT '=== AFFECTED SALES ===' as info;
SELECT COUNT(*) as affected_sales 
FROM sales 
WHERE customer_id IN (
  SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
);

-- Update sales to remove customer references (convert to walk-in sales)
UPDATE sales 
SET customer_id = NULL 
WHERE customer_id IN (
  SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
);

-- Delete retail customers
DELETE FROM customers 
WHERE type = 'retail' OR type IS NULL OR type = '';

-- Show results
SELECT '=== DELETION COMPLETE ===' as info;
SELECT COUNT(*) as remaining_customers FROM customers;
SELECT type, COUNT(*) as count FROM customers GROUP BY type;
