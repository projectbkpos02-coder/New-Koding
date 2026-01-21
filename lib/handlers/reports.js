const { createClient } = require('@supabase/supabase-js');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Generate PDF data (HTML format that can be printed to PDF)
exports.exportReportsPDF = async (req, res) => {
  try {
    await requireAdmin(req);
    const { start_date, end_date, rider_id } = req.query;

    // Get detailed data
    let query = supabase
      .from('transactions')
      .select('*, profiles(full_name, id), transaction_items(quantity, price, product_id, products(name, hpp))');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      console.error('Export PDF error:', error);
      return res.status(500).json({ error: 'Gagal generate laporan' });
    }

    // Calculate aggregates
    let qris_total = 0;
    let tunai_total = 0;
    let total_revenue = 0;
    let total_cost = 0;
    const rider_breakdown = {};

    (transactions || []).forEach(t => {
      if (t.payment_method === 'qris') {
        qris_total += t.total_amount || 0;
      } else if (t.payment_method === 'tunai') {
        tunai_total += t.total_amount || 0;
      }

      // Rider breakdown
      if (!rider_breakdown[t.profiles?.id]) {
        rider_breakdown[t.profiles?.id] = {
          rider_name: t.profiles?.full_name,
          total_sales: 0,
          transactions_count: 0,
          qris: 0,
          tunai: 0,
          revenue: 0,
          cost: 0
        };
      }
      rider_breakdown[t.profiles?.id].total_sales += t.total_amount || 0;
      rider_breakdown[t.profiles?.id].transactions_count += 1;

      if (t.payment_method === 'qris') {
        rider_breakdown[t.profiles?.id].qris += t.total_amount || 0;
      } else {
        rider_breakdown[t.profiles?.id].tunai += t.total_amount || 0;
      }

      // Calculate cost and revenue for profit/loss
      const items = t.transaction_items || [];
      items.forEach(item => {
        const revenue = item.price * item.quantity;
        const cost = (item.products?.hpp || 0) * item.quantity;
        
        rider_breakdown[t.profiles?.id].revenue += revenue;
        rider_breakdown[t.profiles?.id].cost += cost;
        
        total_revenue += revenue;
        total_cost += cost;
      });
    });

    const total_sales = qris_total + tunai_total;
    const gross_profit = total_revenue - total_cost;
    const profit_margin = total_revenue > 0 ? (gross_profit / total_revenue * 100) : 0;

    // Get riders by breakdown
    const riders = Object.values(rider_breakdown).sort((a, b) => b.total_sales - a.total_sales);
    const qris_count = (transactions || []).filter(t => t.payment_method === 'qris').length;
    const tunai_count = (transactions || []).filter(t => t.payment_method === 'tunai').length;

    // Build HTML content
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Penjualan</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; background: #f5f5f5; }
        .container { max-width: 900px; margin: 20px auto; background: white; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; color: #1f2937; margin-bottom: 10px; }
        .header p { color: #6b7280; font-size: 12px; }
        .section { margin-bottom: 40px; }
        .section h2 { font-size: 16px; color: #1f2937; background: #f3f4f6; padding: 10px 15px; margin-bottom: 15px; border-left: 4px solid #2563eb; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; }
        .summary-card .label { color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
        .summary-card .value { font-size: 18px; color: #1f2937; font-weight: bold; }
        .summary-card.positive .value { color: #16a34a; }
        .summary-card.negative .value { color: #dc2626; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table thead { background: #2563eb; color: white; }
        table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; }
        table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        table tbody tr:hover { background: #f9fafb; }
        table .number { text-align: right; font-family: monospace; }
        
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 11px; }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; max-width: 100%; margin: 0; padding: 0; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>LAPORAN PENJUALAN POS RIDER</h1>
        <p>Periode: ${start_date || 'Semua'} s/d ${end_date || 'Sekarang'}</p>
        <p>Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</p>
    </div>

    <!-- Summary Section -->
    <div class="section">
        <h2>📊 RINGKASAN PENJUALAN</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="label">Total Transaksi</div>
                <div class="value">${(transactions?.length || 0).toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card positive">
                <div class="label">Total Penjualan</div>
                <div class="value">Rp ${(total_sales || 0).toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card positive">
                <div class="label">Gross Profit</div>
                <div class="value">Rp ${(gross_profit || 0).toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card positive">
                <div class="label">Profit Margin</div>
                <div class="value">${(profit_margin || 0).toFixed(2)}%</div>
            </div>
        </div>
    </div>

    <!-- Payment Methods Section -->
    <div class="section">
        <h2>💳 METODE PEMBAYARAN</h2>
        <table>
            <thead>
                <tr>
                    <th>Metode</th>
                    <th class="number">Jumlah Transaksi</th>
                    <th class="number">Total</th>
                    <th class="number">Persentase</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>QRIS</td>
                    <td class="number">${qris_count}</td>
                    <td class="number">Rp ${(qris_total || 0).toLocaleString('id-ID')}</td>
                    <td class="number">${total_sales > 0 ? ((qris_total / total_sales) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                    <td>Tunai</td>
                    <td class="number">${tunai_count}</td>
                    <td class="number">Rp ${(tunai_total || 0).toLocaleString('id-ID')}</td>
                    <td class="number">${total_sales > 0 ? ((tunai_total / total_sales) * 100).toFixed(1) : 0}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Rider Performance Section -->
    <div class="section">
        <h2>🚴 PERFORMA PER RIDER</h2>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Rider</th>
                    <th class="number">Transaksi</th>
                    <th class="number">QRIS</th>
                    <th class="number">Tunai</th>
                    <th class="number">Total Penjualan</th>
                    <th class="number">Profit</th>
                    <th class="number">Margin</th>
                </tr>
            </thead>
            <tbody>
                ${riders.map((rider, index) => {
                  const profit = rider.revenue - rider.cost;
                  const margin = rider.revenue > 0 ? (profit / rider.revenue * 100) : 0;
                  return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${rider.rider_name}</td>
                    <td class="number">${rider.transactions_count}</td>
                    <td class="number">Rp ${(rider.qris || 0).toLocaleString('id-ID')}</td>
                    <td class="number">Rp ${(rider.tunai || 0).toLocaleString('id-ID')}</td>
                    <td class="number">Rp ${(rider.total_sales || 0).toLocaleString('id-ID')}</td>
                    <td class="number">Rp ${(profit || 0).toLocaleString('id-ID')}</td>
                    <td class="number">${(margin || 0).toFixed(2)}%</td>
                </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <!-- Profit & Loss Section -->
    <div class="section">
        <h2>💰 LABA RUGI</h2>
        <table>
            <thead>
                <tr>
                    <th>Keterangan</th>
                    <th class="number">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Penjualan (Revenue)</td>
                    <td class="number">Rp ${(total_revenue || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                    <td>Total Biaya/HPP (Cost)</td>
                    <td class="number">Rp ${(total_cost || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr style="border-top: 2px solid #2563eb; font-weight: bold; background: #f0f9ff;">
                    <td>Gross Profit</td>
                    <td class="number" style="color: #16a34a;">Rp ${(gross_profit || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                    <td>Profit Margin</td>
                    <td class="number" style="color: #16a34a; font-weight: bold;">${(profit_margin || 0).toFixed(2)}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Laporan ini digenerate secara otomatis dari sistem POS Rider</p>
        <p>© ${new Date().getFullYear()} POS Rider System. All rights reserved.</p>
    </div>
</div>
</body>
</html>
    `;

    // Set headers for PDF download
    const filename = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(htmlContent);
  } catch (error) {
    console.error('exportReportsPDF error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal export laporan' });
  }
};

// Generate CSV data
exports.exportReportsCSV = async (req, res) => {
  try {
    await requireAdmin(req);
    const { start_date, end_date, rider_id } = req.query;

    let query = supabase
      .from('transactions')
      .select('id, rider_id, total_amount, payment_method, created_at, profiles(full_name)');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Export CSV error:', error);
      return res.status(500).json({ error: 'Gagal generate laporan' });
    }

    // Build CSV
    const headers = ['Tanggal', 'Rider', 'Metode Pembayaran', 'Total'];
    const rows = (transactions || []).map(t => [
      new Date(t.created_at).toLocaleString('id-ID'),
      t.profiles?.full_name || '-',
      t.payment_method || '-',
      t.total_amount || 0
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Set headers for download
    const filename = `laporan_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(csv);
  } catch (error) {
    console.error('exportReportsCSV error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal export laporan' });
  }
};

// Generate Excel data (proper XLSX format)
exports.exportReportsExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    await requireAdmin(req);
    const { start_date, end_date, rider_id } = req.query;

    // Get detailed data
    let query = supabase
      .from('transactions')
      .select('*, profiles(full_name, id), transaction_items(quantity, price, product_id, products(name, hpp))');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query.order('created_at', { ascending: false }).limit(1000);

    if (error) {
      console.error('Export Excel error:', error);
      return res.status(500).json({ error: 'Gagal generate laporan' });
    }

    // Calculate aggregates
    let qris_total = 0;
    let tunai_total = 0;
    let total_revenue = 0;
    let total_cost = 0;
    const rider_breakdown = {};

    (transactions || []).forEach(t => {
      if (t.payment_method === 'qris') {
        qris_total += t.total_amount || 0;
      } else if (t.payment_method === 'tunai') {
        tunai_total += t.total_amount || 0;
      }

      // Rider breakdown
      if (!rider_breakdown[t.profiles?.id]) {
        rider_breakdown[t.profiles?.id] = {
          rider_name: t.profiles?.full_name,
          total_sales: 0,
          transactions_count: 0,
          qris: 0,
          tunai: 0,
          revenue: 0,
          cost: 0
        };
      }
      rider_breakdown[t.profiles?.id].total_sales += t.total_amount || 0;
      rider_breakdown[t.profiles?.id].transactions_count += 1;

      if (t.payment_method === 'qris') {
        rider_breakdown[t.profiles?.id].qris += t.total_amount || 0;
      } else {
        rider_breakdown[t.profiles?.id].tunai += t.total_amount || 0;
      }

      // Calculate cost and revenue for profit/loss
      const items = t.transaction_items || [];
      items.forEach(item => {
        const revenue = item.price * item.quantity;
        const cost = (item.products?.hpp || 0) * item.quantity;
        
        rider_breakdown[t.profiles?.id].revenue += revenue;
        rider_breakdown[t.profiles?.id].cost += cost;
        
        total_revenue += revenue;
        total_cost += cost;
      });
    });

    const total_sales = qris_total + tunai_total;
    const gross_profit = total_revenue - total_cost;
    const profit_margin = total_revenue > 0 ? (gross_profit / total_revenue * 100) : 0;

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summary_data = [
      ['LAPORAN PENJUALAN POS RIDER'],
      [`Periode: ${start_date || 'Semua'} - ${end_date || 'Sekarang'}`],
      [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
      [],
      ['RINGKASAN PENJUALAN'],
      ['Keterangan', 'Jumlah'],
      ['Total Transaksi', transactions?.length || 0],
      ['QRIS', qris_total],
      ['Tunai', tunai_total],
      ['Total Penjualan', total_sales],
      ['Total Biaya/HPP', total_cost],
      ['Gross Profit', gross_profit],
      ['Profit Margin (%)', profit_margin.toFixed(2)]
    ];
    const sheet1 = XLSX.utils.aoa_to_sheet(summary_data);
    sheet1['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, sheet1, 'Ringkasan');

    // Sheet 2: Payment Method
    const payment_data = [
      ['RINGKASAN METODE PEMBAYARAN'],
      ['Metode', 'Jumlah Transaksi', 'Total']
    ];
    const qris_count = (transactions || []).filter(t => t.payment_method === 'qris').length;
    const tunai_count = (transactions || []).filter(t => t.payment_method === 'tunai').length;
    payment_data.push(['QRIS', qris_count, qris_total]);
    payment_data.push(['Tunai', tunai_count, tunai_total]);
    const sheet2 = XLSX.utils.aoa_to_sheet(payment_data);
    sheet2['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, sheet2, 'Metode Pembayaran');

    // Sheet 3: Rider Breakdown
    const rider_data = [
      ['RINGKASAN PER RIDER'],
      ['No', 'Nama Rider', 'Transaksi', 'QRIS', 'Tunai', 'Total Penjualan', 'Biaya/HPP', 'Profit', 'Margin (%)']
    ];
    const riders = Object.values(rider_breakdown).sort((a, b) => b.total_sales - a.total_sales);
    riders.forEach((rider, index) => {
      const profit = rider.revenue - rider.cost;
      const margin = rider.revenue > 0 ? (profit / rider.revenue * 100) : 0;
      rider_data.push([index + 1, rider.rider_name, rider.transactions_count, rider.qris, rider.tunai, rider.total_sales, rider.cost, profit, margin.toFixed(2)]);
    });
    const sheet3 = XLSX.utils.aoa_to_sheet(rider_data);
    sheet3['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, sheet3, 'Per Rider');

    // Sheet 4: Detail Transaksi
    const transaction_data = [
      ['DETAIL TRANSAKSI'],
      ['No', 'Tanggal', 'Rider', 'Metode', 'Total', 'Profit', 'Margin (%)']
    ];
    (transactions || []).forEach((t, index) => {
      const items = t.transaction_items || [];
      let t_revenue = 0;
      let t_cost = 0;
      items.forEach(item => {
        t_revenue += item.price * item.quantity;
        t_cost += (item.products?.hpp || 0) * item.quantity;
      });
      const t_profit = t_revenue - t_cost;
      const t_margin = t_revenue > 0 ? (t_profit / t_revenue * 100) : 0;
      
      transaction_data.push([
        index + 1,
        new Date(t.created_at).toLocaleString('id-ID'),
        t.profiles?.full_name || '-',
        t.payment_method || '-',
        t.total_amount,
        t_profit.toFixed(0),
        t_margin.toFixed(2)
      ]);
    });
    const sheet4 = XLSX.utils.aoa_to_sheet(transaction_data);
    sheet4['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, sheet4, 'Detail Transaksi');

    // Generate Excel file
    const filename = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.end(excelBuffer);
  } catch (error) {
    console.error('exportReportsExcel error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal export laporan' });
  }
};

// Get summary for reports
exports.getSummary = async (req, res) => {
  try {
    await requireAdmin(req);
    const { start_date, end_date, rider_id } = req.query;

    let query = supabase.from('transactions').select('total_amount, rider_id, transaction_items(quantity, price, products(hpp))');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Get summary error:', error);
      return res.json({ total_sales: 0, total_transactions: 0, total_loss: 0, net_profit: 0 });
    }

    let total_sales = 0;
    let total_revenue = 0;
    let total_cost = 0;

    (transactions || []).forEach(t => {
      total_sales += t.total_amount || 0;
      
      // Calculate revenue and cost from transaction items
      const items = t.transaction_items || [];
      items.forEach(item => {
        const revenue = item.price * item.quantity;
        const cost = (item.products?.hpp || 0) * item.quantity;
        
        total_revenue += revenue;
        total_cost += cost;
      });
    });

    const gross_profit = total_revenue - total_cost;
    const total_transactions = transactions?.length || 0;

    res.json({
      total_sales,
      total_transactions,
      total_revenue,
      total_cost,
      gross_profit,
      net_profit: gross_profit
    });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat summary laporan' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    await requireAdmin(req);
    const { start_date, end_date, rider_id } = req.query;

    let query = supabase
      .from('transactions')
      .select('rider_id, total_amount, profiles(full_name, avatar_url)');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Get leaderboard error:', error);
      return res.json([]);
    }

    // Aggregate by rider
    const riderMap = {};
    (transactions || []).forEach(t => {
      if (!riderMap[t.rider_id]) {
        riderMap[t.rider_id] = {
          rider_id: t.rider_id,
          full_name: t.profiles?.full_name || 'Unknown',
          avatar_url: t.profiles?.avatar_url,
          total_sales: 0,
          total_transactions: 0
        };
      }
      riderMap[t.rider_id].total_sales += t.total_amount || 0;
      riderMap[t.rider_id].total_transactions += 1;
    });

    const leaderboard = Object.values(riderMap)
      .sort((a, b) => b.total_sales - a.total_sales);

    res.json(leaderboard);
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat leaderboard rider' });
  }
};

// Get detailed report with payment methods breakdown
exports.getDetailedReport = async (req, res) => {
  try {
    await requireAdmin(req);
    const { start_date, end_date, rider_id, period_type = 'all' } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, profiles(full_name, id), transaction_items(quantity, price, product_id, products(name, hpp))');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }

    const { data: transactions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get detailed report error:', error);
      return res.json({
        summary: {},
        transactions: [],
        payment_breakdown: {},
        rider_breakdown: {},
        profit_loss: {}
      });
    }

    // Calculate totals and breakdowns
    let qris_total = 0;
    let tunai_total = 0;
    const rider_breakdown = {};
    let total_cost = 0;
    let total_revenue = 0;

    (transactions || []).forEach(t => {
      if (t.payment_method === 'qris') {
        qris_total += t.total_amount || 0;
      } else if (t.payment_method === 'tunai') {
        tunai_total += t.total_amount || 0;
      }

      // Rider breakdown
      if (!rider_breakdown[t.profiles?.id]) {
        rider_breakdown[t.profiles?.id] = {
          rider_name: t.profiles?.full_name,
          total_sales: 0,
          transactions_count: 0,
          qris: 0,
          tunai: 0,
          revenue: 0,
          cost: 0
        };
      }
      rider_breakdown[t.profiles?.id].total_sales += t.total_amount || 0;
      rider_breakdown[t.profiles?.id].transactions_count += 1;

      if (t.payment_method === 'qris') {
        rider_breakdown[t.profiles?.id].qris += t.total_amount || 0;
      } else {
        rider_breakdown[t.profiles?.id].tunai += t.total_amount || 0;
      }

      // Calculate cost and revenue for profit/loss
      const items = t.transaction_items || [];
      items.forEach(item => {
        const revenue = item.price * item.quantity;
        const cost = (item.products?.hpp || 0) * item.quantity;
        
        rider_breakdown[t.profiles?.id].revenue += revenue;
        rider_breakdown[t.profiles?.id].cost += cost;
        
        total_revenue += revenue;
        total_cost += cost;
      });
    });

    const total_sales = qris_total + tunai_total;
    const gross_profit = total_revenue - total_cost;
    const profit_margin = total_revenue > 0 ? (gross_profit / total_revenue * 100) : 0;

    res.json({
      summary: {
        total_transactions: transactions?.length || 0,
        total_sales,
        qris_total,
        tunai_total,
        total_revenue,
        total_cost,
        gross_profit,
        profit_margin
      },
      payment_breakdown: {
        qris: qris_total,
        tunai: tunai_total,
        total: total_sales
      },
      rider_breakdown: Object.values(rider_breakdown).sort((a, b) => b.total_sales - a.total_sales),
      transactions: transactions || []
    });
  } catch (error) {
    console.error('getDetailedReport error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat laporan detail' });
  }
};
