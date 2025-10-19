-- Add missing fields to purchases table
ALTER TABLE purchases ADD COLUMN description TEXT DEFAULT NULL;
ALTER TABLE purchases ADD COLUMN supplier_invoice_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE purchases ADD COLUMN delivery_method VARCHAR(100) DEFAULT NULL;