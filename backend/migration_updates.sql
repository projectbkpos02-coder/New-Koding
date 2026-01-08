-- =====================================================
-- MIGRATION: Update Database Schema
-- Run this in Supabase SQL Editor if you already have existing database
-- =====================================================

-- Add payment_method column to stock_opname table
ALTER TABLE stock_opname ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'tunai';

-- Add created_at column to returns table (for proper timestamps)
ALTER TABLE returns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column to rejects table (for tracking updates)
ALTER TABLE rejects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- VERIFY: Check if columns exist
-- =====================================================
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'stock_opname' AND column_name = 'payment_method';
-- 
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'returns' AND column_name = 'created_at';
-- 
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'rejects' AND column_name = 'updated_at';

-- =====================================================
-- STATUS: All migrations applied successfully!
-- =====================================================
