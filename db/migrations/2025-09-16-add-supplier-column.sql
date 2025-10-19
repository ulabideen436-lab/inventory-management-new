-- Migration: Add supplier column to products table
-- This migration will add the supplier column if it doesn't exist

ALTER TABLE products ADD COLUMN supplier VARCHAR(100) DEFAULT NULL;