-- Migration: Add closing_balance column to customers table
ALTER TABLE customers ADD COLUMN closing_balance DECIMAL(10,2) DEFAULT 0;