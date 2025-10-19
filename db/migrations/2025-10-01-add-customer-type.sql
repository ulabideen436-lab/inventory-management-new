-- Migration: Add customer_type column to sales table
-- This allows tracking whether customer uses retail or wholesale pricing for each sale

-- Add customer_type to sales table to track pricing type used for the sale
ALTER TABLE sales ADD COLUMN customer_type ENUM('retail', 'longterm') DEFAULT 'retail';