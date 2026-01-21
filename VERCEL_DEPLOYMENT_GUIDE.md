# 🚀 Panduan Deploy ke Vercel - POS Rider System v2

## 📋 Checklist Pre-Deployment

- [ ] Database migrations sudah dijalankan (HPP field added)
- [ ] Semua products sudah punya HPP value
- [ ] Local testing sudah sukses (Reports halaman baru muncul)
- [ ] Excel download bisa dibuka (TSV format)
- [ ] Commit dan push ke GitHub sudah dilakukan
- [ ] Environment variables siap

---

## 🔑 Environment Variables yang Diperlukan di Vercel

### Vercel Project Settings → Environment Variables

Tambahkan ini (replace dengan values Anda):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (copy dari Supabase Settings → API)
JWT_SECRET=min_32_karakter_untuk_jwt_secret_Anda
REACT_APP_BACKEND_URL=/api
NODE_ENV=production
```

**Cara mendapatkan Supabase credentials:**
1. Buka https://app.supabase.com
2. Pilih project Anda
3. Buka Settings → API
4. Copy: Project URL (SUPABASE_URL) dan "anon" key (SUPABASE_ANON_KEY)

**Generate JWT_SECRET:**
```bash
# Di terminal lokal (atau gunakan online generator)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📱 Deploy ke Vercel - Step by Step

### Step 1: Persiapan Project

```bash
# Di lokal, pastikan sudah di-push ke GitHub
cd /workspaces/New-Koding
git status  # Pastikan clean
git push origin main  # Push semua perubahan
```

### Step 2: Connect ke Vercel

1. Buka https://vercel.com/dashboard
2. Klik **"Add New..." → "Project"**
3. Pilih **GitHub**
4. Find repository: **projectbkpos02-coder/New-Koding**
5. Klik **"Import"**

### Step 3: Configure Project

**Build Settings:**
- Framework Preset: **Other** (otomatis detect dari vercel.json)
- Build Command: Sudah ada di `vercel.json` → `bash vercel-build.sh`
- Output Directory: Sudah ada di `vercel.json`
- Install Command: Default ✅

### Step 4: Add Environment Variables

**Important:** Ini WAJIB sebelum deploy!

1. Di Vercel project settings → **Environment Variables**
2. Tambahkan semua 5 variables di atas:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = eyJhbGciOi...
   JWT_SECRET = xxxxxxxxxxxxxxx
   REACT_APP_BACKEND_URL = /api
   NODE_ENV = production
   ```
3. Klik **"Save"**

### Step 5: Deploy!

1. Klik **"Deploy"**
2. Tunggu build process (5-10 menit)
3. Lihat deployment progress di halaman Vercel
4. Setelah selesai, Anda akan dapat URL: `https://your-project-xxxxx.vercel.app`

### Step 6: Verify Deployment

Setelah deploy sukses:

1. **Buka halaman aplikasi:**
   ```
   https://your-project-xxxxx.vercel.app
   ```

2. **Test halaman laporan:**
   - Login dengan akun admin
   - Buka **Admin → Laporan**
   - Seharusnya muncul: 4 summary cards, 4 tabs, profit calculations
   - Coba filter dengan date range

3. **Test Excel download:**
   - Klik tombol **"Excel"** di halaman Laporan
   - File akan download dengan nama `Laporan_Penjualan_YYYY-MM-DD.tsv`
   - Buka di Excel atau Sheets → pastikan bisa dibuka & formatnya benar

4. **Test PDF download:**
   - Klik tombol **"PDF"** di halaman Laporan
   - File akan download sebagai `.html`
   - Buka di browser, print/save as PDF

5. **Test halaman Products:**
   - Buka **Admin → Produk**
   - Edit salah satu produk
   - Seharusnya ada field **"HPP/Modal"** dengan margin otomatis

---

## 🔍 Troubleshooting Deployment

### ❌ Build Failed

**Error: "Command exited with code"**

Penyebab umum:
- Syntax error di JavaScript
- Missing environment variables
- npm install gagal

**Solusi:**
```bash
# Di lokal:
cd /workspaces/New-Koding
npm install --legacy-peer-deps
cd frontend
npm install --legacy-peer-deps
npm run build  # Pastikan build sukses
# Jika error, fix dulu di lokal sebelum push
```

### ❌ Halaman Blank/Putih

**Error: "Unexpected token '<'"**

Penyebab: 
- Build tidak include file terbaru
- Asset mismatch

**Solusi:**
1. Di Vercel: **Settings → Git → Deployments → Redeploy** (select latest commit)
2. Atau push commit baru ke trigger rebuild

### ❌ Laporan tidak ada perubahan

**Masalah: Halaman laporan masih terlihat lama**

Penyebab:
- Frontend build tidak di-update
- Cache browser masih ada

**Solusi:**
```bash
# 1. Hard refresh di browser:
#    Windows/Linux: Ctrl + Shift + R
#    Mac: Cmd + Shift + R

# 2. Atau clear cache:
#    F12 → Application → Cache Storage → Clear All

# 3. Trigger rebuild di Vercel:
#    Settings → Git → Deployments → Redeploy
```

### ❌ Excel download tidak bisa dibuka

**Error: "File is corrupted" atau tidak bisa dibuka**

Penyebab:
- Excel handler export ke format salah

**Solusi:**
- Cek file yang di-download, seharusnya .tsv (bukan .xlsx)
- Buka dengan Excel atau Google Sheets
- Jika tetap error, check `lib/handlers/reports.js` exportReportsExcel function

---

## 📊 Verify Features Di Production

### ✅ Checklist Fitur yang Harus Ada:

**Halaman Products (/admin/products):**
- [ ] Edit produk → terlihat field "HPP/Modal"
- [ ] Input HPP → Margin otomatis dihitung
- [ ] Save → HPP tersimpan

**Halaman Laporan (/admin/reports):**
- [ ] 4 Summary cards muncul: Total Penjualan, Transaksi, Gross Profit, Margin
- [ ] 4 Tabs: Ringkasan, Metode Pembayaran, Performa Rider, Transaksi Detail
- [ ] Filter date range, rider selection bekerja
- [ ] Tombol download: Excel (hilang CSV), PDF ada
- [ ] Excel download: File `.tsv` bisa dibuka di Excel/Sheets
- [ ] PDF download: File `.html` bisa dibuka di browser
- [ ] Profit calculations: Revenue - Cost = Profit, terlihat di setiap row
- [ ] Margin display: Percentage terlihat untuk setiap transaksi

**Data Akurasi:**
- [ ] Total Penjualan = Sum semua transaksi
- [ ] Gross Profit = Total Revenue - Total Cost (dari HPP)
- [ ] Per-rider profit breakdown akurat
- [ ] QRIS vs Tunai breakdown correct

---

## 🔄 Continuous Deployment (CD)

Setelah deploy sukses, setiap kali Anda:

```bash
git push origin main
```

Vercel OTOMATIS akan:
1. Trigger build process
2. Run tests (jika ada)
3. Deploy ke production jika sukses
4. Update URL dalam 2-5 menit

---

## 📝 Database Migration untuk Production

**PENTING:** Jangan lupa run SQL migration untuk add HPP field!

### Cara 1: Supabase SQL Editor (Recommended)

1. Buka https://app.supabase.com
2. Pilih project Anda
3. Buka **SQL Editor**
4. Create **New Query**, paste ini:

```sql
-- Add HPP field to products table
ALTER TABLE IF NOT EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;

-- Verify column added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'hpp';
```

5. Klik **Run** (or Ctrl+Enter)
6. Verifikasi berhasil → lihat column "hpp" di table "products"

### Cara 2: Via Python Script (jika ada access)

```bash
# Di terminal lokal
cd /workspaces/New-Koding/backend
python3 setup_database.py
```

---

## 🎯 Next Steps (Setelah Deploy)

1. **Update HPP untuk semua produk:**
   - Login sebagai admin
   - Go to **Admin → Produk**
   - Edit setiap produk → input HPP
   - Margin otomatis akan dihitung

2. **Monitor Reports:**
   - Lihat laporan penjualan
   - Verify profit calculations akurat
   - Download Excel/PDF untuk backup

3. **Training Team:**
   - Tunjukkan fitur laporan baru ke team
   - Explain profit/loss calculations
   - Ajarkan cara update HPP

4. **Set Recurring Backups:**
   - Vercel auto-backup? No
   - Supabase auto-backup? Yes (included)
   - Download laporan reguler untuk archive

---

## 🚨 Emergency Issues

### Jika deployment gagal total:

1. **Check Vercel logs:**
   ```
   Vercel Dashboard → Project → Deployments → Select deployment → View logs
   ```

2. **Check GitHub push:**
   ```
   Pastikan commit sudah di-push:
   git push origin main
   git log --oneline | head -5  # Verify latest commit
   ```

3. **Rollback ke deployment sebelumnya:**
   ```
   Vercel Dashboard → Deployments → Select production deployment → Promote
   ```

4. **Nuclear option: Delete & redeploy:**
   ```
   1. Delete project di Vercel
   2. Re-import dari GitHub
   3. Setup environment variables lagi
   4. Deploy
   ```

---

## 📞 Support Contacts

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev

---

## 📋 Deployment Summary Template

**Setelah deploy, isi ini:**

```
📌 DEPLOYMENT SUMMARY
─────────────────────────────────────────
Tanggal Deploy: _____ (date)
Vercel URL: _____ (your-project.vercel.app)
Database: _____ (production Supabase project)
Git Commit: _____ (git show --oneline | head -1)

✅ Deployment Status: _____ (Success/Failed)
✅ Build Time: _____ (minutes)
✅ Tests Passed: _____ (Yes/No/N/A)

📊 Features Verified:
- [ ] Reports halaman baru muncul
- [ ] Excel download bisa dibuka
- [ ] PDF download bisa dibuka
- [ ] HPP field terlihat di Products
- [ ] Profit calculations akurat
- [ ] Filter & search bekerja

🔗 Useful Links:
- Admin URL: https://your-project.vercel.app/login
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Console: https://app.supabase.com
- GitHub Repo: https://github.com/projectbkpos02-coder/New-Koding

Notes:
─────────────────────────────────────────
(Any additional notes or issues?)
```

---

## ✅ Done!

Selamat! Aplikasi sudah deployed ke Vercel dengan fitur laporan dan profit/loss calculations! 🎉

Untuk update ke deployment berikutnya, hanya perlu:
```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel otomatis akan rebuild & deploy
```

**Good luck! 🚀**

---

Generated: January 21, 2026
Version: 1.0 - Vercel Deployment Guide
Status: Ready for Production ✅
