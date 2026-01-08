const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create return request
exports.createReturn = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { product_id, quantity, notes } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity required' });
    }

    // Check rider stock
    const { data: stock } = await supabase
      .from('rider_stock')
      .select('quantity')
      .eq('rider_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock for return' });
    }

    // Create return request
    const { error } = await supabase.from('returns').insert({
      id: uuidv4(),
      rider_id: user.id,
      product_id,
      quantity,
      notes,
      status: 'pending',
      returned_at: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ message: 'Return request submitted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get returns
exports.getReturns = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { status } = req.query;

    let query;

    if (['admin', 'super_admin'].includes(user.role)) {
      query = supabase.from('returns').select('*, products(name, price), profiles(full_name)');
    } else {
      query = supabase
        .from('returns')
        .select('*, products(name, price)')
        .eq('rider_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('returned_at', { ascending: false });

    if (error) {
      // Handle case where table doesn't exist or is empty
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Returns Error:', error);
    res.status(error.status || 500).json({ error: error.message, details: process.env.NODE_ENV === 'development' ? error : undefined });
  }
};

// Approve return
exports.approveReturn = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { return_id } = req.params;

    // Get return request
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', return_id)
      .single();

    if (returnError || !returnData) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Update rider stock (decrease)
    const { data: stock } = await supabase
      .from('rider_stock')
      .select('quantity')
      .eq('rider_id', returnData.rider_id)
      .eq('product_id', returnData.product_id)
      .single();

    if (stock) {
      const newQty = stock.quantity - returnData.quantity;
      if (newQty <= 0) {
        await supabase
          .from('rider_stock')
          .delete()
          .eq('rider_id', returnData.rider_id)
          .eq('product_id', returnData.product_id);
      } else {
        await supabase
          .from('rider_stock')
          .update({ quantity: newQty })
          .eq('rider_id', returnData.rider_id)
          .eq('product_id', returnData.product_id);
      }
    }

    // Update warehouse stock (increase)
    const { data: product } = await supabase
      .from('products')
      .select('stock_in_warehouse')
      .eq('id', returnData.product_id)
      .single();

    const newWarehouseStock = product.stock_in_warehouse + returnData.quantity;
    await supabase
      .from('products')
      .update({ stock_in_warehouse: newWarehouseStock })
      .eq('id', returnData.product_id);

    // Update return status
    await supabase
      .from('returns')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', return_id);

    // Record in return history
    await supabase.from('return_history').insert({
      id: uuidv4(),
      rider_id: returnData.rider_id,
      product_id: returnData.product_id,
      quantity: returnData.quantity,
      notes: returnData.notes,
      status: 'approved',
      approved_by: user.id,
      returned_at: returnData.returned_at,
      approved_at: new Date().toISOString(),
    });

    // Delete from returns
    await supabase.from('returns').delete().eq('id', return_id);

    res.json({ message: 'Return approved successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Reject return
exports.rejectReturn = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { return_id } = req.params;

    // Get return request
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', return_id)
      .single();

    if (returnError || !returnData) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Record in return history
    await supabase.from('return_history').insert({
      id: uuidv4(),
      rider_id: returnData.rider_id,
      product_id: returnData.product_id,
      quantity: returnData.quantity,
      notes: returnData.notes,
      status: 'rejected',
      approved_by: user.id,
      returned_at: returnData.returned_at,
      approved_at: new Date().toISOString(),
    });

    // Delete from returns
    await supabase.from('returns').delete().eq('id', return_id);

    res.json({ message: 'Return rejected' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
