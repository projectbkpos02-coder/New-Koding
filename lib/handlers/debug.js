const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Protected debug endpoint: check stock_opnames table existence and count
exports.checkStockOpname = async (req, res) => {
  try {
    try {
      await requireAdmin(req);
    } catch (e) {
      console.error('Debug requireAdmin error:', e);
      return res.status(e.status || 401).json({ error: e.message || 'Unauthorized' });
    }

    // Use head + count to avoid fetching data
    const { count, error } = await supabase
      .from('stock_opnames')
      .select('id', { head: true, count: 'exact' });

    if (error) {
      console.error('Debug stock_opnames error:', error);
      return res.json({ exists: false, error: error.message });
    }

    return res.json({ exists: true, count: count || 0 });
  } catch (err) {
    console.error('Unexpected debug error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Detailed debug: run the same select used by getStockOpnames to capture query errors
exports.checkStockOpnameDetailed = async (req, res) => {
  try {
    try {
      await requireAdmin(req);
    } catch (e) {
      console.error('Debug detailed requireAdmin error:', e);
      return res.status(e.status || 401).json({ error: e.message || 'Unauthorized' });
    }

    // Try the same select used in getStockOpnames to reproduce errors
    const { data, error } = await supabase
      .from('stock_opnames')
      .select('*, products(name), riders:profiles!rider_id(full_name)')
      .limit(1);

    if (error) {
      console.error('Detailed debug query error:', error);
      return res.status(500).json({ error: error.message, code: error.code, details: error });
    }

    // Also return a safe count (head) if available
    const { count, error: countErr } = await supabase
      .from('stock_opnames')
      .select('id', { head: true, count: 'exact' });
    if (countErr) console.error('Detailed debug count error:', countErr);

    return res.json({ ok: true, sample: data || [], count: count || null });
  } catch (err) {
    console.error('Unexpected detailed debug error:', err);
    return res.status(500).json({ error: err.message });
  }
};
