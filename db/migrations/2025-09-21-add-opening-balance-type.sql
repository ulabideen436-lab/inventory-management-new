-- Add opening balance type field to customers table
-- This field will store whether the opening balance is 'Dr' (debit) or 'Cr' (credit)

ALTER TABLE customers ADD COLUMN opening_balance_type ENUM('Dr', 'Cr') DEFAULT 'Dr';

-- Update existing customers to have 'Dr' for positive balances and 'Cr' for negative balances
UPDATE customers 
SET opening_balance_type = CASE 
    WHEN opening_balance >= 0 THEN 'Dr'
    ELSE 'Cr'
END;

-- Convert negative opening balances to positive values since the type now indicates Dr/Cr
UPDATE customers 
SET opening_balance = ABS(opening_balance) 
WHERE opening_balance < 0;