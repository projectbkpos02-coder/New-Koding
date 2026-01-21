# 🗄️ SQL Script - Add HPP Field to Products Table

## 📌 Untuk Menambahkan HPP/Modal ke Database

Gunakan SQL script ini di **Supabase SQL Editor** untuk add column HPP ke products table.

---

## 🚀 Step-by-Step Cara Menjalankan

### 1. Buka Supabase Console

```
https://app.supabase.com
```

### 2. Pilih Project Anda

- Click project Anda di dashboard

### 3. Buka SQL Editor

- Klik **"SQL Editor"** di sidebar kiri
- atau buka: https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new

### 4. Copy-Paste Script Berikut

Pilih salah satu script di bawah berdasarkan kebutuhan Anda:

---

## ✅ Script #1: Basic - Add HPP Column (RECOMMENDED)

Gunakan ini jika Anda baru pertama kali menambahkan HPP field:

```sql
-- Add HPP (Harga Pokok Penjualan/Cost) column to products table
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Verify column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY column_name;
```

**Apa yang dilakukan:**
- ✅ Menambah column `hpp` dengan tipe DECIMAL(12, 2)
- ✅ Default value = 0 (untuk existing products)
- ✅ `IF NOT EXISTS` = aman dijalankan berkali-kali
- ✅ Verify query = check apakah column berhasil ditambah

---

## ✅ Script #2: With Index - Add HPP Column + Index

Gunakan ini jika Anda ingin optimize query performance:

```sql
-- Add HPP column
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Add index untuk faster queries
CREATE INDEX IF NOT EXISTS idx_products_hpp 
ON products(hpp);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'hpp';
```

---

## ✅ Script #3: With Initial Values - Add HPP + Set Default Values

Gunakan ini jika Anda ingin set HPP untuk existing products based on price:

```sql
-- Add HPP column
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Initialize HPP = 70% of price (adjust % jika perlu)
-- Ini hanya untuk existing products yang belum punya HPP value
UPDATE products 
SET hpp = ROUND(price * 0.70, 2) 
WHERE hpp = 0 OR hpp IS NULL;

-- Verify hasil
SELECT id, name, price, hpp, 
  ROUND((price - hpp) / price * 100, 1) AS margin_percent
FROM products 
LIMIT 10;
```

**Penjelasan:**
- `hpp = price * 0.70` = set HPP ke 70% dari harga jual
- Adjust `0.70` jika margin Anda berbeda (contoh: `0.60` untuk 40% margin)
- `LIMIT 10` = show first 10 products untuk verifikasi

---

## ✅ Script #4: Complete Setup - All in One

Jalankan semua langkah sekaligus:

```sql
-- Step 1: Add HPP column
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_hpp ON products(hpp);

-- Step 3: Create view untuk easier reporting
CREATE OR REPLACE VIEW product_margins AS
SELECT 
  id,
  name,
  price,
  hpp,
  ROUND(price - hpp, 2) AS profit_per_unit,
  ROUND((price - hpp) / price * 100, 1) AS margin_percent
FROM products
WHERE price > 0;

-- Step 4: Verify everything
SELECT COUNT(*) as total_products, 
  SUM(CASE WHEN hpp > 0 THEN 1 ELSE 0 END) as products_with_hpp,
  AVG(CASE WHEN price > 0 THEN (price - hpp) / price * 100 ELSE 0 END)::NUMERIC(5,1) as avg_margin_percent
FROM products;

-- Step 5: Show sample data
SELECT id, name, price, hpp, 
  ROUND((price - hpp) / price * 100, 1) AS margin_percent
FROM products 
LIMIT 5;
```

---

## 🎯 Mana Script yang Harus Saya Gunakan?

| Situasi | Script |
|---------|--------|
| **Baru pertama kali setup** | Script #1 (Basic) |
| **Mau optimize performance** | Script #2 (With Index) |
| **Mau auto-set HPP default** | Script #3 (With Initial Values) |
| **Mau complete setup satu kali** | Script #4 (Complete) |

**Rekomendasi:** Gunakan **Script #1** (Basic) dulu. Setelah itu, update HPP di UI aplikasi untuk each product.

---

## 📋 Langkah-Langkah Eksekusi di Supabase

### 1. Buka SQL Editor
- Buka: https://app.supabase.com/project/YOUR_PROJECT/sql/new

### 2. Copy Script

Pilih salah satu script di atas, copy seluruh text

### 3. Paste ke Editor

Klik di text editor, paste dengan Ctrl+V (atau Cmd+V di Mac)

### 4. Run Query

Klik tombol **"Run"** atau tekan **Ctrl+Enter** (Cmd+Enter di Mac)

### 5. Lihat Hasil

Script akan execute dan tampilkan hasil di bawah:
- ✅ Jika sukses: "Query executed successfully"
- ❌ Jika error: Baca error message untuk tahu masalahnya

### 6. Verify Column Ada

Cek di Supabase:
1. Buka **"Table Editor"**
2. Pilih table **"products"**
3. Scroll right → seharusnya ada column **"hpp"**

---

## ✅ Verification Query

Setelah jalankan script, copy-paste query ini untuk verify:

```sql
-- Check HPP column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('hpp', 'id', 'name', 'price')
ORDER BY ordinal_position;
```

Expected output:
```
column_name | data_type | column_default | is_nullable
─────────────────────────────────────────────────────
id          | uuid      | NULL           | false
name        | text      | NULL           | true
price       | numeric   | NULL           | true
hpp         | numeric   | 0              | true
```

---

## 🔍 Check Data After Adding HPP

Jalankan query ini untuk lihat data:

```sql
SELECT 
  id,
  name,
  price,
  hpp,
  CASE 
    WHEN price > 0 THEN ROUND((price - hpp) / price * 100, 1)
    ELSE 0
  END as margin_percent
FROM products
LIMIT 10;
```

---

## 🛑 Jika Ada Error

### Error #1: "relation 'products' does not exist"

**Penyebab:** Table name salah atau table tidak ada

**Solusi:**
```sql
-- Check nama table yang benar
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%product%';
```

### Error #2: "column 'hpp' already exists"

**Penyebab:** Column sudah ada dari sebelumnya

**Solusi:** Tidak masalah, script sudah punya `IF NOT EXISTS` jadi aman. Tinggal verify saja dengan verification query.

### Error #3: "permission denied"

**Penyebab:** Akun Supabase tidak punya akses

**Solusi:** Login dengan akun yang punya owner/admin role

---

## 📊 Sample Data untuk Testing

Setelah add HPP column, Anda bisa test dengan insert data:

```sql
-- Check existing products
SELECT id, name, price FROM products LIMIT 5;

-- Update one product for testing
UPDATE products 
SET hpp = 10000 
WHERE id = 'first-product-uuid-here'
LIMIT 1;

-- Verify
SELECT id, name, price, hpp, 
  ROUND((price - hpp) / price * 100, 1) as margin
FROM products 
WHERE hpp > 0;
```

---

## 💡 Tips

- ✅ **Backup data dulu** sebelum run script
- ✅ **Test di staging** sebelum production
- ✅ **Verify column** setelah selesai
- ✅ **Update HPP values** melalui UI aplikasi (Admin → Produk)
- ✅ **Monitor profit** di halaman Reports setelah HPP diisi

---

## 🎯 Next Steps

Setelah jalankan SQL script:

1. **Verify column ada** (lihat di Table Editor)
2. **Login ke aplikasi** sebagai admin
3. **Buka halaman Products** (Admin → Produk)
4. **Edit beberapa produk** → isi HPP field
5. **Buka Reports** → lihat profit calculations muncul

---

**Status:** ✅ Ready untuk copy-paste ke Supabase SQL Editor

**Questions?** Refer ke SUPABASE_SETUP.md untuk setup lebih detail

Generated: January 21, 2026
