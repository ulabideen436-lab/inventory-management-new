-- Migration: Add cost_price column to products table (MySQL-compatible)
-- This checks INFORMATION_SCHEMA first to avoid errors on older MySQL/MariaDB

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'cost_price'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


