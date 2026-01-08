const { createClient } = require('@supabase/supabase-js');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get riders list (admin only)
exports.getRiders = async (req, res) => {
  try {
    await requireAdmin(req);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url, created_at')
      .order('full_name');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get riders with performance data
exports.getRiderLeaderboard = async (req, res) => {
  try {
    await authenticateUser(req);

    // This is a complex query that joins multiple tables
    // You'll need to create a Supabase view or function for this
    const { data, error } = await supabase
      .from('rider_leaderboard')
      .select('*')
      .order('total_sales', { ascending: false });

    if (error) {
      // Fallback if view doesn't exist
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get user reports
exports.getUserReports = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('transactions')
      .select('rider_id, profiles(full_name), sum(total_amount)');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query.order('rider_id');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
