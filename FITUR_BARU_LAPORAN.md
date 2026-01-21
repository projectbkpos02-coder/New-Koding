# 📊 FITUR BARU - LAPORAN PENJUALAN & LABA RUGI

## 🎉 Yang Baru di Sistem

### ✨ Halaman Produk - Tambah Field HPP/Modal

**Sebelum:**
```
┌─────────────────────────────────────┐
│ Nama Produk  │ Harga              │
│ SKU          │ Kategori           │
│ Min. Stok    │ URL Gambar         │
└─────────────────────────────────────┘
```

**Sesudah:**
```
┌──────────────────────────────────────────────────┐
│ Nama Produk    │ SKU                            │
├──────────────────────────────────────────────────┤
│ Harga Jual     │ HPP/Modal (BARU!)              │
├──────────────────────────────────────────────────┤
│ Margin: 40%    │ ← Auto-calculated!             │
├──────────────────────────────────────────────────┤
│ Kategori       │ Min. Stok                      │
│ URL Gambar                                      │
└──────────────────────────────────────────────────┘
```

**Cara Penggunaan:**
1. Buka `/admin/products`
2. Klik "Tambah Produk" atau Edit produk
3. Isi HPP/Modal (biaya produk)
4. Margin otomatis akan dihitung
5. Klik Simpan

---

## 📈 Halaman Laporan - Redesign Lengkap

### Dashboard Summary (Paling Atas)

```
┌─────────────────────────────────────────────────────────────┐
│                  LAPORAN PENJUALAN                         │
│        Ringkasan penjualan dan analisis laba rugi          │
│                                                            │
│  Download Options: [Cetak] [Excel] [PDF]                 │
└─────────────────────────────────────────────────────────────┘

Filter Section:
  Dari: [date]  Sampai: [date]  Rider: [dropdown]
  [Hari Ini] [7 Hari] [30 Hari] [1 Tahun] [Filter] [Reset]

4 Summary Cards:
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Total Penjualan  │ Total Transaksi  │ Gross Profit     │ Profit Margin    │
│ Rp 1.000.000     │        50        │ Rp 500.000       │      50.00%       │
│      📈          │      🛒         │      📊          │      📈          │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### 4 Tab Laporan

#### Tab 1: Ringkasan (Laba Rugi)
```
┌─────────────────────────────────────────────┐
│ 📄 Ringkasan Penjualan & Laba Rugi         │
├─────────────────────────────────────────────┤
│  Revenue (Total Penjualan)    Rp 1.000.000 │
│  Total Biaya/HPP              Rp 500.000   │
│  ─────────────────────────────────────────  │
│  Gross Profit (Laba Kotor)    Rp 500.000   │
│  Profit Margin                50%          │
└─────────────────────────────────────────────┘
```

#### Tab 2: Metode Pembayaran
```
┌────────────────────────────────────────────────────┐
│ 💳 Ringkasan Metode Pembayaran                    │
├────────────────────────────────────────────────────┤
│  QRIS:                                            │
│  Rp 600.000 (60% dari total)                     │
│                                                   │
│  Tunai:                                          │
│  Rp 400.000 (40% dari total)                     │
│                                                   │
│  Total Penjualan:  Rp 1.000.000                 │
└────────────────────────────────────────────────────┘
```

#### Tab 3: Performa Rider
```
┌────────┬────────┬──────────┬──────────┬──────────┬──────────┬────────┐
│ Rider  │ Trans  │   QRIS   │  Tunai   │  Total   │  Profit  │ Margin │
├────────┼────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ Rider A│  10    │ Rp 300k  │ Rp 200k  │ Rp 500k  │ Rp 250k  │ 50%    │
│ Rider B│  8     │ Rp 250k  │ Rp 250k  │ Rp 500k  │ Rp 200k  │ 40%    │
│ Rider C│  7     │ Rp 150k  │ Rp 350k  │ Rp 500k  │ Rp 175k  │ 35%    │
│ TOTAL  │  25    │ Rp 700k  │ Rp 800k  │ Rp 1500k │ Rp 625k  │ 42%    │
└────────┴────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

#### Tab 4: Transaksi Detail
```
┌─────────────────────┬──────────────┬──────────┬──────────────────┐
│ Tanggal             │ Rider        │ Metode   │ Total            │
├─────────────────────┼──────────────┼──────────┼──────────────────┤
│ 21/1/2026 14:30     │ Rider A      │ QRIS     │ Rp 250.000       │
│ 21/1/2026 13:15     │ Rider B      │ Tunai    │ Rp 350.000       │
│ 21/1/2026 12:00     │ Rider A      │ QRIS     │ Rp 200.000       │
│ ...                 │ ...          │ ...      │ ...              │
└─────────────────────┴──────────────┴──────────┴──────────────────┘
```

---

## 📥 Download Laporan

### Excel Download
- Nama File: `Laporan_Penjualan_2026-01-21.xlsx`
- Isi:
  * Header & periode laporan
  * Summary dengan metrics
  * Breakdown metode pembayaran
  * Per rider performance
  * Detail transaksi
  * Format: Kompatibel Microsoft Excel

### PDF Download
- Nama File: `Laporan_Penjualan_2026-01-21.html`
- Isi:
  * Professional styling
  * Color-coded sections
  * 4 Summary cards
  * Payment breakdown
  * Rider performance table
  * Profit & Loss statement
- Cara: Buka file → Ctrl+P → Save as PDF

---

## 🧮 Cara Kerja Laba Rugi

### Contoh Sederhana:

**Produk: Mie Bakso**
- Harga Jual: Rp 50.000
- HPP/Modal: Rp 30.000
- Margin: 40%

**Transaksi:**
- Rider A jual 5 porsi dengan QRIS

**Kalkulasi Otomatis:**
```
Revenue = Rp 50.000 × 5 = Rp 250.000
Cost = Rp 30.000 × 5 = Rp 150.000
Profit = Rp 250.000 - Rp 150.000 = Rp 100.000
Margin = (Rp 100.000 / Rp 250.000) × 100% = 40%
```

**Tampilannya di Report:**
```
Total Penjualan (Revenue): Rp 250.000
Total Biaya (HPP Cost): Rp 150.000
Gross Profit: Rp 100.000
Profit Margin: 40%

Performa Rider A:
- QRIS: Rp 250.000
- Tunai: Rp 0
- Profit: Rp 100.000
- Margin: 40%
```

---

## 🎯 Keuntungan Fitur Baru

✅ **Transparansi Finansial**
- Tahu persis berapa profit dari setiap transaksi
- Lihat breakdown QRIS vs Tunai
- Monitor profit per rider

✅ **Analisis Mendalam**
- Per rider performance
- Trend profit harian/mingguan/bulanan/tahunan
- Payment method analysis
- Profit margin percentage

✅ **Data Export**
- Excel untuk sharing & analisis lanjut
- PDF untuk printing & archiving
- Data backup

✅ **Automatic Calculation**
- Tidak perlu hitung manual
- Semua profit otomatis terkalkulasi
- Akurat dan konsisten

---

## 🔄 Workflow Pengguna

### Setup Awal (One-time)

```
1. Buka /admin/products
   ↓
2. Edit setiap produk
   ↓
3. Isi HPP/Modal (biaya produksi)
   ↓
4. Margin otomatis dihitung
   ↓
5. Simpan
   ↓
   [Selesai, siap laporan!]
```

### Penggunaan Harian

```
1. Transaksi rider → Profit otomatis terkalkulasi
   ↓
2. Akhir hari/minggu/bulan → Buka Laporan
   ↓
3. Filter tanggal sesuai kebutuhan
   ↓
4. Lihat profit di 4 tab
   ↓
5. Download Excel/PDF kalau perlu
   ↓
   [Selesai, data tercatat]
```

---

## 💡 Tips Penggunaan

### 1. Setup HPP yang Akurat
```
✅ BENAR: HPP = Biaya bahan + Biaya prep
❌ SALAH: HPP = Harga jual atau 0
```

### 2. Monitor Profit Margin
```
Ideal profit margin untuk F&B: 40-60%
Jika kurang dari 30% → Cek harga
Jika lebih dari 70% → Bagus, maintain
```

### 3. Bandingkan Rider Performance
```
Tab "Performa Rider" menunjukkan:
- Rider A profit 50%, Rider B 35%
- Tanya Rider B kenapa marginnya lebih rendah
- Bantu optimasi harga/cost
```

### 4. Filter & Analisis
```
- "Hari Ini" → Cek profit harian
- "7 Hari" → Weekly trend
- "30 Hari" → Monthly analysis
- "1 Tahun" → Yearly overview
```

---

## ⚠️ Penting Diingat

⚠️ **HPP adalah Kunci**
- Tanpa HPP yang benar → Laporan tidak akurat
- Update HPP jika ada perubahan biaya
- Teliti saat input HPP pertama kali

⚠️ **Profit ≠ Penjualan**
- Profit = Revenue - Cost
- Contoh: Jual Rp 100k, biaya Rp 60k → Profit Rp 40k
- Jangan lupa ada operating cost lainnya

⚠️ **Data Konsisten**
- Gunakan filter yang sama untuk analisa
- Bandingkan apples-to-apples
- Catat bila ada transaksi khusus

---

## 📞 Bantuan Cepat

**Q: Margin tidak dihitung otomatis**
A: Pastikan HPP ada nilainya (bukan 0)

**Q: Profit menunjukkan angka aneh**
A: Cek HPP produk yang digunakan, pastikan akurat

**Q: Download tidak bekerja**
A: Coba browser lain, atau refresh halaman

**Q: Data laporan tidak update**
A: Klik tombol Filter atau refresh halaman

---

## 🚀 Next Steps

1. ✅ **Baca** dokumentasi ini
2. ✅ **Setup** HPP untuk semua produk
3. ✅ **Test** buat transaksi kecil
4. ✅ **Check** laporan di /admin/reports
5. ✅ **Verify** profit calculations
6. ✅ **Download** sample Excel/PDF
7. ✅ **Train** team tentang fitur baru
8. ✅ **Monitor** profit harian mulai sekarang!

---

**Siap? Buka → `/admin/products` → Mulai update HPP! 🚀**

---

Generated: January 21, 2026
Version: 1.0 - User Guide
Status: Ready ✅
