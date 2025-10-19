-- Add opening balance fields to suppliers table
-- This migration adds opening_balance and opening_balance_type columns to match the supplier controller expectations

ALTER TABLE suppliers ADD COLUMN opening_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN opening_balance_type ENUM('debit', 'credit') DEFAULT 'debit';

-- Update existing suppliers to have their current balance as opening balance
UPDATE suppliers 
SET opening_balance = balance, 
    opening_balance_type = CASE 
        WHEN balance >= 0 THEN 'debit'
        ELSE 'credit'
    END
WHERE balance IS NOT NULL;

-- Convert negative opening balances to positive values since the type now indicates debit/credit
UPDATE suppliers 
SET opening_balance = ABS(opening_balance) 
WHERE opening_balance < 0;