const { createClient } = require('@supabase/supabase-js');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get rider stock
exports.getRiderStock = async (req, res) => {
  try {
    const user = await authenticateUser(req);

    let query = supabase.from('rider_stock').select('*, products(name, price, image_url)');

    if (!['admin', 'super_admin'].includes(user.role)) {
      query = query.eq('rider_id', user.id);
    } else {
      query = query.select('*, products(name, price, image_url), profiles(full_name)');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get specific rider's stock
exports.getRiderStockById = async (req, res) => {
  try {
    await requireAdmin(req);
    const { rider_id } = req.params;

    const { data, error } = await supabase
      .from('rider_stock')
      .select('*, products(name, price, image_url)')
      .eq('rider_id', rider_id);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
