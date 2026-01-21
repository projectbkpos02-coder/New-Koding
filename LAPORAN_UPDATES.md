# Dokumentasi Update Halaman Laporan & Laba Rugi

## Ringkasan Perubahan

Update ini menyempurnakan halaman laporan penjualan dengan fitur lengkap analisis laba rugi, download format Excel dan PDF, serta manajemen produk dengan field HPP/Modal.

---

## 1. PERUBAHAN DATABASE

### File: `backend/add_hpp_field.sql`
**Status:** ✅ DITAMBAHKAN

Menambahkan field `hpp` (Harga Pokok Penjualan) ke tabel `products`:
```sql
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS hpp DECIMAL(12, 2) DEFAULT 0;
```

**Penjelasan:** Field ini menyimpan biaya produksi/modal untuk setiap produk, digunakan untuk menghitung laba rugi secara otomatis.

---

## 2. PERUBAHAN BACKEND API

### File: `lib/handlers/products.js`
**Status:** ✅ DIUPDATE

**Perubahan:**
- Menambahkan `hpp` ke fungsi `getProducts()` - field dikembalikan dalam response
- Menambahkan parameter `hpp` di fungsi `createProduct()` untuk input saat membuat produk baru
- Menambahkan parameter `hpp` di fungsi `updateProduct()` untuk edit produk

**Contoh Response:**
```json
{
  "id": "uuid",
  "name": "Produk A",
  "price": 50000,
  "hpp": 30000,
  "margin": 40%
}
```

### File: `lib/handlers/reports.js`
**Status:** ✅ DIUPDATE LENGKAP

**Fungsi Baru:**

#### 1. `getDetailedReport()` - ENDPOINT BARU
Mengambil laporan detail dengan breakdown QRIS/Tunai dan kalkulasi laba rugi per rider
```javascript
GET /api/reports/detailed?start_date=&end_date=&rider_id=
```
Response berisi:
- `summary`: Total sales, revenue, cost, gross profit, profit margin
- `payment_breakdown`: Detail QRIS vs Tunai
- `rider_breakdown`: Per rider dengan profit calculation
- `transactions`: Detail semua transaksi

#### 2. `exportReportsExcel()` - DIUPDATE
Sebelumnya hanya export data sederhana, sekarang export:
- Ringkasan penjualan dengan metrik laba rugi
- Breakdown metode pembayaran
- Per rider performance dengan profit margin
- Detail transaksi lengkap
Format: TSV (Tab-Separated Values) yang kompatibel dengan Excel

#### 3. `exportReportsPDF()` - ENDPOINT BARU
Export laporan dalam format HTML yang bisa di-print ke PDF:
- Header dengan informasi laporan
- 4 summary cards: Total Transaksi, Total Penjualan, Gross Profit, Profit Margin
- Tabel metode pembayaran (QRIS vs Tunai)
- Tabel performa rider dengan profit breakdown
- Tabel laba rugi detail

#### 4. `getSummary()` - DIUPDATE
Sekarang menghitung laba rugi otomatis:
- `total_revenue`: Total penjualan (harga jual × qty)
- `total_cost`: Total biaya/HPP (HPP × qty)
- `gross_profit`: Revenue - Cost
- Sebelumnya hanya mengembalikan `net_profit = total_sales`

### File: `api/index.js`
**Status:** ✅ DIUPDATE

Menambahkan 2 endpoint baru:
```javascript
GET /api/reports/detailed      → reports.getDetailedReport()
GET /api/reports/export/pdf    → reports.exportReportsPDF()
```

---

## 3. PERUBAHAN FRONTEND API CLIENT

### File: `frontend/src/lib/api.js`
**Status:** ✅ DIUPDATE

Menambahkan method baru ke `reportsAPI`:
```javascript
reportsAPI.getDetailed(params)    // Ambil laporan detail
reportsAPI.exportPDF(params)      // Export PDF
```

---

## 4. PERUBAHAN UI HALAMAN PRODUK

### File: `frontend/src/pages/admin/Products.js`
**Status:** ✅ DIUPDATE

**Perubahan:**
- Tambah field `hpp` di form state
- Tambah input field untuk "HPP/Modal" di dialog produk
- Tambah field "Margin" read-only yang otomatis hitung: `(harga - hpp) / harga × 100%`
- Update `handleOpenDialog()` untuk populate `hpp` saat edit
- Update `handleSave()` untuk kirim `hpp` ke API

**UI Baru:**
```
┌─────────────────────────────────────────┐
│ Nama Produk *        │ SKU              │
├─────────────────────────────────────────┤
│ Harga Jual *         │ HPP/Modal        │
├─────────────────────────────────────────┤
│ Kategori             │ Min. Stok        │
│ URL Gambar                              │
│ [Margin: Auto Calculated]               │
└─────────────────────────────────────────┘
```

---

## 5. PERUBAHAN UI HALAMAN LAPORAN

### File: `frontend/src/pages/admin/Reports.js`
**Status:** ✅ COMPLETE REWRITE

**Fitur Dihapus:**
- ❌ Tombol Download CSV (tidak lagi diperlukan)

**Fitur Ditambahkan:**
- ✅ Tombol Download PDF (HTML format)
- ✅ 4 Summary Cards: Total Penjualan, Total Transaksi, Gross Profit, Profit Margin
- ✅ 4 Tabs View:
  1. **Ringkasan**: Tampilkan Revenue, Cost, Gross Profit, Margin
  2. **Metode Pembayaran**: QRIS vs Tunai dengan persentase
  3. **Performa Rider**: Tabel detail per rider dengan profit calculation
  4. **Transaksi Detail**: Semua transaksi dengan breakdown pembayaran

**Filter Ditambahkan:**
- ✅ Preset "1 Tahun" untuk laporan tahunan

**Data Laporan:**
- Breakdown QRIS (berapa, persentase)
- Breakdown Tunai (berapa, persentase)
- Per rider: Transaksi, QRIS, Tunai, Total Sales, Profit, Margin %
- Gross Profit (Revenue - HPP Cost)
- Profit Margin %

---

## 6. FLOW KALKULASI LABA RUGI

### Input Data
```
Transaction
├── Transaction Item 1
│   ├── product_id
│   ├── quantity
│   ├── price (harga jual)
│   └── Product.hpp (biaya/modal)
├── Transaction Item 2
│   └── ...
```

### Kalkulasi per Transaksi
```
Revenue = price × quantity
Cost = product.hpp × quantity
Profit = Revenue - Cost
Margin = (Profit / Revenue) × 100%
```

### Kalkulasi per Rider
```
Total Revenue = Σ (price × qty) untuk semua transaksi rider
Total Cost = Σ (hpp × qty) untuk semua transaksi rider
Total Profit = Total Revenue - Total Cost
Profit Margin = (Total Profit / Total Revenue) × 100%
```

### Kalkulasi Global
```
Grand Total Revenue = Σ Total Revenue semua rider
Grand Total Cost = Σ Total Cost semua rider
Gross Profit = Grand Total Revenue - Grand Total Cost
Profit Margin = (Gross Profit / Grand Total Revenue) × 100%
```

---

## 7. FITUR EXPORT

### Excel Export
- File: `Laporan_Penjualan_YYYY-MM-DD.xlsx`
- Format: TSV (Tab-Separated, kompatibel Excel)
- Konten:
  - Ringkasan penjualan & laba rugi
  - Breakdown metode pembayaran
  - Per rider performance
  - Detail transaksi

### PDF Export
- File: `Laporan_Penjualan_YYYY-MM-DD.html`
- Format: HTML dengan CSS styling profesional
- Bisa di-print to PDF langsung dari browser
- Konten:
  - Header laporan dengan periode
  - 4 summary cards dengan warna-warna berbeda
  - Tabel metode pembayaran dengan progress indicator
  - Tabel performa rider
  - Tabel laba rugi

---

## 8. INTEGRASI DENGAN DATA EXISTING

### Backward Compatibility
- ✅ Field `hpp` default ke 0 untuk produk lama
- ✅ Semua endpoint lama tetap berfungsi
- ✅ Report lama bisa di-filter tanpa error

### Data Migration (Manual)
Admin harus mengupdate field HPP untuk setiap produk:
1. Buka halaman Produk
2. Klik Edit produk
3. Masukkan HPP/Modal
4. Klik Simpan

Setelah itu, laporan laba rugi akan menunjukkan data akurat.

---

## 9. TESTING CHECKLIST

- [ ] Database migration: `add_hpp_field.sql` dijalankan
- [ ] Buka halaman Products, cek field HPP ada di form
- [ ] Buat produk baru dengan HPP, cek tersimpan
- [ ] Edit produk lama, update HPP
- [ ] Buat transaksi baru
- [ ] Buka Laporan, filter tanggal
- [ ] Verifikasi Summary Cards menampilkan angka benar
- [ ] Tab "Ringkasan" - cek Revenue, Cost, Profit, Margin
- [ ] Tab "Metode Pembayaran" - cek QRIS vs Tunai breakdown
- [ ] Tab "Performa Rider" - cek profit per rider
- [ ] Download Excel - verifikasi isi laporan
- [ ] Download PDF - verifikasi format HTML

---

## 10. STRUKTUR FILE BERUBAH

### Baru Ditambahkan:
```
backend/
  └── add_hpp_field.sql
```

### File Diupdate:
```
lib/handlers/
  ├── products.js          ✅ Tambah field hpp
  └── reports.js           ✅ Major update (getDetailedReport, exportReportsPDF, getSummary)

api/
  └── index.js             ✅ Tambah 2 endpoint baru

frontend/src/
  ├── lib/api.js           ✅ Tambah 2 method reportsAPI
  ├── pages/admin/
  │   ├── Products.js      ✅ Tambah field HPP di form
  │   └── Reports.js       ✅ Complete redesign, hapus CSV, tambah PDF, laba rugi
```

---

## 11. NOTES & BEST PRACTICES

### Untuk Admin/User:
1. **Update HPP Produk Dulu**: Sebelum bisa lihat laporan laba rugi, pastikan semua produk sudah punya field HPP
2. **Manfaatkan Filter**: Gunakan filter tanggal untuk analisis per periode (harian, mingguan, bulanan, tahunan)
3. **Monitor Profit Margin**: Lihat tab "Performa Rider" untuk tahu rider mana yang paling profit

### Untuk Developer:
1. **Join Query**: Report detail memerlukan join dengan transaction_items dan products untuk HPP
2. **Kalkulasi**: Semua kalkulasi laba rugi dilakukan di backend untuk konsistensi
3. **Caching**: Pertimbangkan caching report jika data transaksi besar

---

## 12. FUTURE IMPROVEMENTS

- [ ] Add COGS (Cost of Goods Sold) breakdown per produk
- [ ] Operating expenses tracking
- [ ] Net profit calculation (Gross Profit - Operating Expenses)
- [ ] Chart visualization untuk trend laba rugi
- [ ] Export to actual .xlsx file (bukan TSV) using library seperti exceljs
- [ ] Email report scheduled harian/mingguan/bulanan
- [ ] Budget vs Actual comparison
