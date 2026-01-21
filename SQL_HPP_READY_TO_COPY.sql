-- ============================================
-- SQL SCRIPT: Add HPP Column to Products Table
-- ============================================
-- 
-- Gunakan di: Supabase SQL Editor
-- Cara: Copy seluruh script ini, paste di Supabase SQL Editor, klik Run
-- 
-- ============================================

-- STEP 1: Add HPP column (Harga Pokok Penjualan / Cost)
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- STEP 2: Add index untuk performa query
CREATE INDEX IF NOT EXISTS idx_products_hpp 
ON products(hpp);

-- STEP 3: Verify - Lihat column yang baru ditambah
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'hpp'
ORDER BY ordinal_position;

-- STEP 4: Summary - Lihat status products
SELECT 
  COUNT(*) as total_products, 
  SUM(CASE WHEN hpp > 0 THEN 1 ELSE 0 END) as products_with_hpp,
  SUM(CASE WHEN hpp = 0 THEN 1 ELSE 0 END) as products_without_hpp
FROM products;

-- STEP 5: Sample - Lihat 10 produk pertama
SELECT 
  id, 
  name, 
  price, 
  hpp,
  ROUND((price - hpp) / price * 100, 1) as margin_percent
FROM products 
LIMIT 10;

-- ============================================
-- SELESAI!
-- Sekarang HPP field ada di products table
-- Next: Update HPP values di aplikasi (Admin → Produk)
-- ============================================
