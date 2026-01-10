const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create return request (admin only)
exports.createReturn = async (req, res) => {
  try {
    // Only admin/super_admin can create return requests
    let adminUser;
    try {
      adminUser = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat membuat return' });
    }

    // Support single return or bulk items array
    const { product_id, quantity, notes, rider_id, items } = req.body;

    if (!rider_id) {
      return res.status(400).json({ error: 'rider_id required' });
    }

    const toCreate = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        if (!it.product_id || !it.quantity) continue;
        toCreate.push({ product_id: it.product_id, quantity: it.quantity, notes: it.notes || notes });
      }
    } else {
      if (!product_id || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity required' });
      }
      toCreate.push({ product_id, quantity, notes });
    }

    // Validate stock and prepare inserts
    const inserts = [];
    for (const row of toCreate) {
      const { product_id: pid, quantity: qty } = row;
      const { data: stock } = await supabase
        .from('rider_stock')
        .select('quantity')
        .eq('rider_id', rider_id)
        .eq('product_id', pid)
        .single();

      if (!stock || stock.quantity < qty) {
        return res.status(400).json({ error: `Insufficient stock for return (product ${pid})` });
      }

      inserts.push({
        id: uuidv4(),
        rider_id,
        product_id: pid,
        quantity: qty,
        notes: row.notes || row.notes === '' ? row.notes : notes,
        status: 'pending',
        returned_at: new Date().toISOString(),
        created_by: adminUser.id,
      });
    }

    if (inserts.length === 0) {
      return res.status(400).json({ error: 'No valid return items provided' });
    }

    const { error } = await supabase.from('returns').insert(inserts);
    if (error) throw error;

    res.json({ message: 'Return request(s) submitted successfully' });
  } catch (error) {
    console.error('createReturn error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal membuat request return' });
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
    console.error('getReturns error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat return' });
  }
};

// Approve return
exports.approveReturn = async (req, res) => {
  try {
    let user;
    try {
      user = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat menyetujui return' });
    }
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

    res.json({ message: 'Return berhasil disetujui' });
  } catch (error) {
    console.error('approveReturn error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal menyetujui return' });
  }
};

// Reject return
exports.rejectReturn = async (req, res) => {
  try {
    let user;
    try {
      user = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat menolak return' });
    }
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

    res.json({ message: 'Return berhasil ditolak' });
  } catch (error) {
    console.error('rejectReturn error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal menolak return' });
  }
};
