-- Migration: Add payment_method column to stock_opname
ALTER TABLE stock_opname
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'tunai';

-- Optional: ensure details column exists as JSONB (kept for compatibility)
ALTER TABLE stock_opname
ALTER COLUMN details SET DATA TYPE JSONB USING details::jsonb;
