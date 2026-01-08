const { createClient } = require('@supabase/supabase-js');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

// Generate Excel-like data (CSV with XLS headers works in Excel)
// For true XLSX, use a library like 'xlsx' package
exports.exportReportsExcel = async (req, res) => {
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
      console.error('Export Excel error:', error);
      return res.status(500).json({ error: 'Gagal generate laporan' });
    }

    // Build simple Excel-compatible CSV
    const headers = ['Tanggal', 'Rider', 'Metode Pembayaran', 'Total'];
    const rows = (transactions || []).map(t => [
      new Date(t.created_at).toLocaleString('id-ID'),
      t.profiles?.full_name || '-',
      t.payment_method || '-',
      t.total_amount || 0
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join('\t')).join('\n');

    // Set headers for Excel download
    const filename = `laporan_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(csv);
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

    let query = supabase.from('transactions').select('total_amount, rider_id');

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

    const total_sales = (transactions || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const total_transactions = transactions?.length || 0;

    res.json({
      total_sales,
      total_transactions,
      total_loss: 0,
      net_profit: total_sales
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
