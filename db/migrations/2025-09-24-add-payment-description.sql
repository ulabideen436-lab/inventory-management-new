-- Migration: Add description column to payments table
ALTER TABLE payments ADD COLUMN description TEXT;
