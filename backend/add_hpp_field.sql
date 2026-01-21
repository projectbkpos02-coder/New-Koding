-- Add HPP (Cost/Modal) field to products table
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Update existing schema if table exists
-- This is safe as it will only add the column if it doesn't exist
