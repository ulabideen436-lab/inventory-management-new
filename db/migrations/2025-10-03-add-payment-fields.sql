-- Add payment_method and payment_date columns to payments table
ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL;
ALTER TABLE payments ADD COLUMN payment_date DATETIME DEFAULT NULL;