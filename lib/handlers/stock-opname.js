const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create stock opname
exports.createStockOpname = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { rider_id, items, notes } = req.body;

    if (!rider_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Rider ID and items required' });
    }

    // Create stock opname record
    const opnameId = uuidv4();

    for (const item of items) {
      const { error } = await supabase.from('stock_opnames').insert({
        id: uuidv4(),
        opname_id: opnameId,
        rider_id,
        product_id: item.product_id,
        remaining_quantity: item.remaining_quantity,
        admin_id: user.id,
        notes,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    }

    res.json({ message: 'Stock opname recorded successfully', opname_id: opnameId });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get stock opnames
exports.getStockOpnames = async (req, res) => {
  try {
    await requireAdmin(req);
    const { rider_id, start_date, end_date } = req.query;

    let query = supabase
      .from('stock_opnames')
      .select('*, products(name), riders:profiles!rider_id(full_name)');

    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      // Handle case where table doesn't exist or is empty
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Stock Opname Error:', error);
    res.status(error.status || 500).json({ error: error.message, details: process.env.NODE_ENV === 'development' ? error : undefined });
  }
};
