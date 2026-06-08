-- Migration: Add wallet_type column if it doesn't exist and drop old category check constraint
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS wallet_type TEXT NOT NULL DEFAULT 'Cashless';

-- Drop the old category check constraint to allow new Indonesian category names
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_category_check;
