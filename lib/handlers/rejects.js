const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create reject request
exports.createReject = async (req, res) => {
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
      return res.status(400).json({ error: 'Insufficient stock for reject' });
    }

    // Create reject request
    const { error } = await supabase.from('rejects').insert({
      id: uuidv4(),
      rider_id: user.id,
      product_id,
      quantity,
      notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ message: 'Reject request submitted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get rejects
exports.getRejects = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { status } = req.query;

    let query;

    if (['admin', 'super_admin'].includes(user.role)) {
      query = supabase.from('rejects').select('*, products(name, price), profiles(full_name)');
    } else {
      query = supabase
        .from('rejects')
        .select('*, products(name, price)')
        .eq('rider_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // Handle case where table doesn't exist or is empty
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Rejects Error:', error);
    res.status(error.status || 500).json({ error: error.message, details: process.env.NODE_ENV === 'development' ? error : undefined });
  }
};

// Approve reject
exports.approveReject = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { reject_id } = req.params;

    // Get reject request
    const { data: rejectData, error: rejectError } = await supabase
      .from('rejects')
      .select('*')
      .eq('id', reject_id)
      .single();

    if (rejectError || !rejectData) {
      return res.status(404).json({ error: 'Reject not found' });
    }

    // Update rider stock (decrease) - Product is lost, NOT returned to warehouse
    const { data: stock } = await supabase
      .from('rider_stock')
      .select('quantity')
      .eq('rider_id', rejectData.rider_id)
      .eq('product_id', rejectData.product_id)
      .single();

    if (stock) {
      const newQty = stock.quantity - rejectData.quantity;
      if (newQty <= 0) {
        await supabase
          .from('rider_stock')
          .delete()
          .eq('rider_id', rejectData.rider_id)
          .eq('product_id', rejectData.product_id);
      } else {
        await supabase
          .from('rider_stock')
          .update({ quantity: newQty })
          .eq('rider_id', rejectData.rider_id)
          .eq('product_id', rejectData.product_id);
      }
    }

    // Record in reject history (for loss calculation)
    await supabase.from('reject_history').insert({
      id: uuidv4(),
      rider_id: rejectData.rider_id,
      product_id: rejectData.product_id,
      quantity: rejectData.quantity,
      notes: rejectData.notes,
      status: 'approved',
      approved_by: user.id,
      created_at: rejectData.created_at,
      approved_at: new Date().toISOString(),
    });

    // Update reject status
    await supabase
      .from('rejects')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reject_id);

    // Delete from rejects
    await supabase.from('rejects').delete().eq('id', reject_id);

    res.json({ message: 'Reject approved successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Reject a reject request
exports.rejectReject = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { reject_id } = req.params;

    // Get reject request
    const { data: rejectData, error: rejectError } = await supabase
      .from('rejects')
      .select('*')
      .eq('id', reject_id)
      .single();

    if (rejectError || !rejectData) {
      return res.status(404).json({ error: 'Reject not found' });
    }

    // Record in reject history
    await supabase.from('reject_history').insert({
      id: uuidv4(),
      rider_id: rejectData.rider_id,
      product_id: rejectData.product_id,
      quantity: rejectData.quantity,
      notes: rejectData.notes,
      status: 'rejected',
      approved_by: user.id,
      created_at: rejectData.created_at,
      approved_at: new Date().toISOString(),
    });

    // Delete from rejects
    await supabase.from('rejects').delete().eq('id', reject_id);

    res.json({ message: 'Reject request denied' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
