-- Add opening balance type field to suppliers table
-- This field will store whether the opening balance is 'debit' or 'credit'

ALTER TABLE suppliers ADD COLUMN opening_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN opening_balance_type ENUM('debit', 'credit') DEFAULT 'debit';

-- Update existing suppliers to have their current balance as opening balance
UPDATE suppliers 
SET opening_balance = ABS(balance),
    opening_balance_type = CASE 
        WHEN balance >= 0 THEN 'debit'
        ELSE 'credit'
    END
WHERE balance IS NOT NULL;

-- For suppliers with NULL balance, set defaults
UPDATE suppliers 
SET opening_balance = 0,
    opening_balance_type = 'debit'
WHERE balance IS NULL;
