const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create reject request (admin only)
exports.createReject = async (req, res) => {
  try {
    // Only admin/super_admin can create reject requests
    let adminUser;
    try {
      adminUser = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat membuat reject' });
    }

    const { product_id, quantity, notes, rider_id } = req.body;

    if (!product_id || !quantity || !rider_id) {
      return res.status(400).json({ error: 'Product ID, quantity, and rider_id required' });
    }

    // notes (reason) is required for rejects
    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Keterangan (reason) untuk reject wajib diisi' });
    }

    // Check rider stock
    const { data: stock } = await supabase
      .from('rider_stock')
      .select('quantity')
      .eq('rider_id', rider_id)
      .eq('product_id', product_id)
      .single();

    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock for reject' });
    }

    // Create reject request (created by admin for rider)
    const { error } = await supabase.from('rejects').insert({
      id: uuidv4(),
      rider_id,
      product_id,
      quantity,
      notes,
      status: 'pending',
      created_at: new Date().toISOString(),
      created_by: adminUser.id,
    });

    if (error) throw error;

    res.json({ message: 'Reject request submitted successfully' });
  } catch (error) {
    console.error('createReject error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal membuat request reject' });
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
    console.error('getRejects error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat reject' });
  }
};

// Approve reject
exports.approveReject = async (req, res) => {
  try {
    let user;
    try {
      user = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat menyetujui reject' });
    }
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

    res.json({ message: 'Reject berhasil disetujui' });
  } catch (error) {
    console.error('approveReject error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal menyetujui reject' });
  }
};

// Reject a reject request
exports.rejectReject = async (req, res) => {
  try {
    let user;
    try {
      user = await requireAdmin(req);
    } catch (e) {
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin dapat menolak reject' });
    }
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

    res.json({ message: 'Permintaan reject ditolak' });
  } catch (error) {
    console.error('rejectReject error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal menolak reject' });
  }
};
