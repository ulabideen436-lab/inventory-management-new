-- Migration: Add enhanced fields for purchases and payments
-- Date: 2025-10-02

-- Add fields to purchases table
ALTER TABLE purchases ADD COLUMN description TEXT;
ALTER TABLE purchases ADD COLUMN supplier_invoice_id VARCHAR(100);
ALTER TABLE purchases ADD COLUMN delivery_method VARCHAR(100);

-- Add fields to payments table  
ALTER TABLE payments ADD COLUMN payment_method VARCHAR(100);
ALTER TABLE payments ADD COLUMN payment_date DATE;