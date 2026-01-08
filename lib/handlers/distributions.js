const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create distribution
exports.createDistribution = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { rider_id, items, notes } = req.body;

    if (!rider_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Rider ID and items required' });
    }

    for (const item of items) {
      // Check warehouse stock
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('stock_in_warehouse, name')
        .eq('id', item.product_id)
        .single();

      if (prodError || !product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.stock_in_warehouse < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock_in_warehouse}`,
        });
      }

      // Decrease warehouse stock
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_in_warehouse: product.stock_in_warehouse - item.quantity,
        })
        .eq('id', item.product_id);

      if (updateError) throw updateError;

      // Get current rider stock
      const { data: riderStock } = await supabase
        .from('rider_stock')
        .select('quantity')
        .eq('rider_id', rider_id)
        .eq('product_id', item.product_id)
        .single();

      if (riderStock) {
        // Update existing rider stock
        const { error: stockUpdateError } = await supabase
          .from('rider_stock')
          .update({ quantity: riderStock.quantity + item.quantity })
          .eq('rider_id', rider_id)
          .eq('product_id', item.product_id);

        if (stockUpdateError) throw stockUpdateError;
      } else {
        // Create new rider stock
        const { error: stockInsertError } = await supabase
          .from('rider_stock')
          .insert({
            id: uuidv4(),
            rider_id,
            product_id: item.product_id,
            quantity: item.quantity,
          });

        if (stockInsertError) throw stockInsertError;
      }

      // Record distribution history
      const { error: distError } = await supabase
        .from('distributions')
        .insert({
          id: uuidv4(),
          rider_id,
          product_id: item.product_id,
          quantity: item.quantity,
          admin_id: user.id,
          notes,
          distributed_at: new Date().toISOString(),
        });

      if (distError) throw distError;
    }

    res.json({ message: 'Distribution successful' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get distributions
exports.getDistributions = async (req, res) => {
  try {
    await requireAdmin(req);
    const { rider_id, start_date, end_date } = req.query;

    let query = supabase
      .from('distributions')
      .select(
        `
        *,
        products(name),
        rider:profiles!distributions_rider_id_fkey(full_name),
        admin:profiles!distributions_admin_id_fkey(full_name)
      `
      );

    if (rider_id) {
      query = query.eq('rider_id', rider_id);
    }
    if (start_date) {
      query = query.gte('distributed_at', start_date);
    }
    if (end_date) {
      query = query.lte('distributed_at', end_date);
    }

    const { data, error } = await query
      .order('distributed_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
