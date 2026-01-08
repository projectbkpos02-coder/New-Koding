const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create production record
exports.createProduction = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { product_id, quantity, notes } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity required' });
    }

    // Get current product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('stock_in_warehouse')
      .eq('id', product_id)
      .single();

    if (prodError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newStock = product.stock_in_warehouse + quantity;

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_in_warehouse: newStock })
      .eq('id', product_id);

    if (updateError) throw updateError;

    // Record production history
    const { error: recordError } = await supabase
      .from('productions')
      .insert({
        id: uuidv4(),
        product_id,
        quantity,
        admin_id: user.id,
        notes,
        created_at: new Date().toISOString(),
      });

    if (recordError) throw recordError;

    res.json({ message: 'Production recorded successfully', new_stock: newStock });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get all productions
exports.getProductions = async (req, res) => {
  try {
    await requireAdmin(req);

    const { data, error } = await supabase
      .from('productions')
      .select(
        `
        *,
        products(name),
        admin:profiles!productions_admin_id_fkey(full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
