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
