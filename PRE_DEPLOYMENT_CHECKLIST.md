# ✅ Pre-Deployment Verification Checklist

## 📌 Sebelum Deploy ke Vercel, Pastikan:

### 1. Code Quality ✅

- [ ] Tidak ada syntax errors:
  ```bash
  cd /workspaces/New-Koding && npm run lint 2>/dev/null || echo "No linter"
  ```

- [ ] Tidak ada console.error atau warnings kritis
- [ ] All imports resolved
- [ ] All components load properly

**Verify di local:**
```bash
npm start  # atau npm run dev
# Buka http://localhost:3001
# Test halaman reports → pastikan no errors di console (F12)
```

### 2. Reports Page ✅

**Feature checklist:**

- [ ] **4 Summary Cards visible:**
  - Total Penjualan (showing correct sum)
  - Total Transaksi (showing transaction count)
  - Gross Profit (showing revenue - cost)
  - Profit Margin (showing percentage)

- [ ] **4 Tabs working:**
  - Ringkasan tab (Profit/Loss summary)
  - Metode Pembayaran tab (QRIS vs Tunai breakdown)
  - Performa Rider tab (Per-rider table with profit)
  - Transaksi Detail tab (Transaction list)

- [ ] **Filters working:**
  - Date range filter
  - Rider selection
  - Preset filters: Today, 7 Days, 30 Days, 1 Year

- [ ] **Download options:**
  - No CSV button ❌
  - Excel button present ✅
  - PDF button present ✅

**Test in browser console:**
```javascript
// Paste ini di F12 → Console
fetch('/api/reports/detailed').then(r => r.json()).then(d => console.log(d))
// Should show: summary, payment_breakdown, rider_breakdown, transactions
```

### 3. Excel Export ✅

- [ ] **File downloads successfully**
- [ ] **Filename is correct:** `Laporan_Penjualan_YYYY-MM-DD.tsv`
- [ ] **File can be opened in Excel/Sheets**
- [ ] **Content shows:**
  - LAPORAN PENJUALAN POS RIDER header
  - RINGKASAN PENJUALAN section with metrics
  - RINGKASAN METODE PEMBAYARAN section
  - RINGKASAN PER RIDER section
  - DETAIL TRANSAKSI section
  - Profit calculations visible in each row

**Test command:**
```bash
# Download Excel via API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reports/export/excel" \
  -o test_report.tsv

# Verify file can open
file test_report.tsv
wc -l test_report.tsv  # Should have multiple rows
```

### 4. PDF Export ✅

- [ ] **File downloads successfully**
- [ ] **Filename is:** `Laporan_Penjualan_YYYY-MM-DD.html`
- [ ] **File can be opened in browser**
- [ ] **Shows professional format with:**
  - 4 colored summary cards
  - Payment method breakdown
  - Rider performance table
  - Profit & Loss statement

### 5. Products Page (HPP Field) ✅

- [ ] **Edit product dialog shows HPP field**
- [ ] **HPP field accepts decimal values**
- [ ] **Margin auto-calculates:** (Price - HPP) / Price × 100%
- [ ] **HPP saves correctly to database**
- [ ] **Existing products show 0 or existing HPP value**

**Test:**
1. Go to Admin → Products
2. Click edit on any product
3. Check for "HPP/Modal" field
4. Enter value: 10000
5. Enter price: 20000
6. Should show Margin: 50%
7. Save → verify in database

### 6. Database ✅

- [ ] **HPP column exists in products table:**
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'products' AND column_name = 'hpp'
  -- Should return: hpp
  ```

- [ ] **HPP has correct data type:** DECIMAL(12, 2)
- [ ] **Default value is 0**
- [ ] **At least some products have HPP values**

### 7. API Routes ✅

**All routes must be working:**

- [ ] `GET /api/reports/detailed` → returns detailed report data
- [ ] `GET /api/reports/export/excel` → returns TSV file
- [ ] `GET /api/reports/export/pdf` → returns HTML file
- [ ] `GET /api/reports/summary` → returns summary data
- [ ] `PUT /api/products/:id` → accepts hpp parameter
- [ ] `POST /api/products` → accepts hpp in body

**Test in terminal:**
```bash
# Test detailed report
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reports/detailed" | jq '.'

# Should show response with summary, payment_breakdown, rider_breakdown
```

### 8. Git Status ✅

- [ ] **All files committed:**
  ```bash
  cd /workspaces/New-Koding
  git status  # Should show "nothing to commit"
  ```

- [ ] **Latest commit pushed:**
  ```bash
  git log --oneline | head -1
  git push origin main  # Should show "Everything up-to-date"
  ```

- [ ] **No .env or sensitive files in git:**
  ```bash
  git log --all --pretty=format: --name-only | sort -u | grep -E "\.env|secrets|keys"
  # Should return nothing
  ```

### 9. Environment Variables ✅

- [ ] **Created `.env` file locally with:**
  ```
  SUPABASE_URL=your_url
  SUPABASE_ANON_KEY=your_key
  JWT_SECRET=your_secret
  FRONTEND_URL=your_domain
  NODE_ENV=development
  ```

- [ ] **.env is in .gitignore** (not committed)
- [ ] **Vercel project has all 5 env variables set:**
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - JWT_SECRET
  - REACT_APP_BACKEND_URL
  - NODE_ENV

### 10. Build Test ✅

**Local build should succeed:**

```bash
# Backend build check
cd /workspaces/New-Koding
node -c lib/handlers/reports.js  # Check syntax
node -c api/index.js

# Frontend build check
cd /workspaces/New-Koding/frontend
npm run build  # Should complete successfully
# Check for errors in output
ls -lh build/  # Folder should exist with content
```

---

## 🎯 Final Pre-Deploy Verification

Run this command to verify everything:

```bash
#!/bin/bash

echo "========== PRE-DEPLOYMENT VERIFICATION =========="

# 1. Check git status
echo "✓ Git Status:"
cd /workspaces/New-Koding
git status | head -3

# 2. Check file exists
echo "✓ Key Files:"
test -f lib/handlers/reports.js && echo "  ✅ reports.js exists" || echo "  ❌ reports.js missing"
test -f frontend/src/pages/admin/Reports.js && echo "  ✅ Reports.js exists" || echo "  ❌ Reports.js missing"
test -f api/index.js && echo "  ✅ api/index.js exists" || echo "  ❌ api/index.js missing"

# 3. Check build
echo "✓ Frontend Build:"
cd /workspaces/New-Koding/frontend
npm run build 2>&1 | tail -5

# 4. Check syntax
echo "✓ Syntax Check:"
node -c /workspaces/New-Koding/lib/handlers/reports.js && echo "  ✅ reports.js" || echo "  ❌ Error"

echo "========== VERIFICATION COMPLETE =========="
```

---

## 🚀 When All Checked:

✅ Ready to deploy to Vercel!

Follow steps in **VERCEL_DEPLOYMENT_GUIDE.md**

---

## 🔍 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Unexpected token '<'" | Hard refresh (Ctrl+Shift+R) or Clear Cache |
| Excel file corrupted | File should be .tsv not .xlsx, try Google Sheets |
| Profit showing 0 | Check if HPP is set for products in admin page |
| Reports page blank | Check console for errors (F12), restart server |
| API 404 errors | Verify routes in api/index.js, restart server |

---

**Status: Ready for Deployment? ✅**

If all checkboxes marked, you're good to go to Vercel! 🚀

---

Generated: January 21, 2026
Version: 1.0
