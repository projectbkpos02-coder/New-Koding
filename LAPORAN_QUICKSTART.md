# QUICK START - Update Laporan & Laba Rugi

## 🚀 Step-by-Step Implementation

### Step 1: Database Migration
**File:** `backend/add_hpp_field.sql`

Jalankan SQL query berikut di Supabase SQL Editor:
```sql
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;
```

Atau melalui Python:
```python
# Jika menggunakan Supabase Python client
from supabase import create_client
import os

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

supabase.rpc('exec_sql', {"query": "ALTER TABLE products ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0"}).execute()
```

### Step 2: Deploy Code Changes

1. **Backend Handler Updates:**
   - ✅ `lib/handlers/products.js` - Support HPP field
   - ✅ `lib/handlers/reports.js` - Laba rugi calculation

2. **API Routes:**
   - ✅ `api/index.js` - Register `/api/reports/detailed` dan `/api/reports/export/pdf`

3. **Frontend Client:**
   - ✅ `frontend/src/lib/api.js` - Add methods

4. **UI Components:**
   - ✅ `frontend/src/pages/admin/Products.js` - HPP field
   - ✅ `frontend/src/pages/admin/Reports.js` - Full redesign

### Step 3: Testing

#### Test Products Page:
```
1. Open /admin/products
2. Click "Tambah Produk"
3. Fill:
   - Nama: "Produk Test"
   - Harga Jual: 100000
   - HPP/Modal: 60000
   - Kategori: (select any)
4. Save
5. Verify Margin shows: 40%
6. Edit produk, change HPP to 70000
7. Verify Margin auto-update to 30%
```

#### Test Reports Page:
```
1. Make few transactions with different payment methods (QRIS/Tunai)
2. Open /admin/reports
3. Click "Filter" atau select date range
4. Verify 4 cards showing:
   - Total Penjualan (sum all transactions)
   - Total Transaksi (count)
   - Gross Profit (calculated from revenue - cost)
   - Profit Margin (percentage)
5. Click Tab "Ringkasan" - verify revenue, cost, profit
6. Click Tab "Metode Pembayaran" - verify QRIS vs Tunai breakdown
7. Click Tab "Performa Rider" - verify per rider profit calculation
8. Click Tab "Transaksi Detail" - verify all transactions
```

#### Test Export:
```
1. In Reports page, click "Download Excel"
2. Verify file contains:
   - Laporan Penjualan header
   - Summary section
   - Payment breakdown
   - Per rider performance
   - Transaction details

3. Click "Download PDF"
4. Verify HTML file opens with:
   - Professional styling
   - Color-coded sections
   - All data visible
5. Try Print to PDF from browser (Ctrl+P)
```

### Step 4: Data Population

#### Update Existing Products with HPP:
```
1. Go to /admin/products
2. For each product:
   - Click Edit
   - Enter HPP (cost/modal)
   - Click Save
3. Repeat untuk semua produk
```

Alternative - Bulk Update via SQL:
```sql
-- Update HPP untuk semua produk (contoh: 70% dari harga)
UPDATE products 
SET hpp = ROUND(price * 0.70, 2)
WHERE hpp = 0 OR hpp IS NULL;
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Transaction Created                      │
│  (Rider sells item with payment method: QRIS/Tunai)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Transaction Record       │
        │  - rider_id                │
        │  - total_amount            │
        │  - payment_method (QRIS)   │
        │  - created_at              │
        └────────────┬───────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────┐
    │     Transaction Items                │
    │ ┌──────────────────────────────────┐ │
    │ │ Item 1:                          │ │
    │ │ - product_id                     │ │
    │ │ - price: 50000 (harga jual)      │ │
    │ │ - quantity: 2                    │ │
    │ │ - Product.hpp: 30000 (biaya)     │ │
    │ │                                  │ │
    │ │ Revenue = 50000 × 2 = 100000    │ │
    │ │ Cost = 30000 × 2 = 60000        │ │
    │ │ Profit = 40000                   │ │
    │ └──────────────────────────────────┘ │
    └────────────┬─────────────────────────┘
                 │
     ┌───────────┴────────────┐
     │                        │
     ▼                        ▼
┌────────────┐        ┌────────────┐
│ Rider View │        │Admin View  │
│ - My Sales │        │ - Report   │
│ - Summary  │        │ - Profit   │
└────────────┘        │ - Export   │
                      └────────────┘
```

---

## 🔍 Verification Checklist

- [ ] HPP field exists in products table
- [ ] Products page shows HPP input & margin calculation
- [ ] Can create/edit products with HPP
- [ ] Reports page loads without error
- [ ] Summary cards show correct values
- [ ] "Ringkasan" tab shows Revenue/Cost/Profit/Margin
- [ ] "Metode Pembayaran" shows QRIS vs Tunai
- [ ] "Performa Rider" shows profit per rider
- [ ] Excel export works & contains all sections
- [ ] PDF/HTML export works & opens correctly
- [ ] Profit calculations are accurate (Revenue - HPP Cost)
- [ ] Filter by date/rider works
- [ ] Preset filters (Hari Ini, 7 Hari, 30 Hari, 1 Tahun) work

---

## 🐛 Troubleshooting

### Issue: "hpp column does not exist"
**Solution:** 
1. Run migration SQL: `ALTER TABLE products ADD COLUMN IF NOT EXISTS hpp...`
2. Restart backend server
3. Verify in Supabase console that column exists

### Issue: Report shows 0 for all profit values
**Solution:**
1. Check if products have HPP value (not null/0)
2. Update products: Edit each, set HPP, save
3. Refresh report page
4. Profit should now show: Revenue - (HPP × quantity)

### Issue: Excel/PDF download button doesn't work
**Solution:**
1. Check browser console for errors (F12 → Console tab)
2. Verify API endpoints are registered in `api/index.js`
3. Test API directly: `curl http://localhost:3000/api/reports/export/excel`
4. Check if backend is running and connected to Supabase

### Issue: Margin calculation shows NaN
**Solution:**
1. Ensure both Harga Jual and HPP are valid numbers
2. Check form validation in Products.js
3. Try clearing form and re-enter values

---

## 📝 File Reference

### Backend Files:
- `backend/add_hpp_field.sql` - Database migration
- `lib/handlers/products.js` - Product CRUD with HPP
- `lib/handlers/reports.js` - Report queries & exports
- `api/index.js` - API route definitions

### Frontend Files:
- `frontend/src/lib/api.js` - API client methods
- `frontend/src/pages/admin/Products.js` - Product management UI
- `frontend/src/pages/admin/Reports.js` - Report UI with profit analysis

### Documentation:
- `LAPORAN_UPDATES.md` - Complete technical documentation
- This file - Quick start guide

---

## 🎯 Success Indicators

✅ **You're successful when:**
1. HPP field appears in Products form
2. Margin auto-calculates as (price-hpp)/price × 100%
3. Reports page shows 4 cards with numbers
4. Tabs display profit breakdown per method/rider
5. Excel download contains formatted report
6. PDF opens with professional styling
7. Profit calculations match (revenue - cost)

---

## 💡 Tips

1. **For Testing:** Create test products with obvious numbers:
   - Product A: Price 100, HPP 60 → Margin 40%
   - Product B: Price 50, HPP 20 → Margin 60%

2. **For Analysis:** Use different filters:
   - Harian (Today) - daily sales
   - 7 Hari - weekly trend
   - 30 Hari - monthly analysis
   - 1 Tahun - yearly overview

3. **For Export:** 
   - Excel for sharing with office
   - PDF for printing/archiving
   - Always download after updating data

---

Generated: January 2026
Version: 1.0
Status: Ready for Production ✅
