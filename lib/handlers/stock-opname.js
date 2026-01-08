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
    let user;
    try {
      user = await requireAdmin(req);
    } catch (e) {
      console.error('createStockOpname requireAdmin error:', e);
      return res.status(403).json({ error: 'Akses ditolak: hanya admin atau super_admin yang dapat melakukan stock opname' });
    }

    const { rider_id, items, notes, payment_method } = req.body;

    if (!rider_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Rider ID and items required' });
    }

    // Fetch current rider stock to compute sold quantities
    const { data: currentStock = [], error: stockErr } = await supabase
      .from('rider_stock')
      .select('product_id, quantity')
      .eq('rider_id', rider_id);

    if (stockErr) throw stockErr;

    const stockMap = {};
    (currentStock || []).forEach(s => { stockMap[s.product_id] = s.quantity; });

    let totalSales = 0;
    const salesDetails = [];

    // Prepare updates to rider_stock and compute sales details
    for (const item of items) {
      const prevQty = stockMap[item.product_id] || 0;
      const remaining = Number(item.remaining_quantity || 0);
      const sold = Math.max(0, prevQty - remaining);

      // Fetch product price to compute sale amount
      const { data: productData } = await supabase.from('products').select('id, name, price').eq('id', item.product_id).single();
      const price = productData?.price || 0;
      const saleAmount = sold * price;
      totalSales += saleAmount;

      salesDetails.push({
        product_id: item.product_id,
        product_name: productData?.name || null,
        prev_quantity: prevQty,
        remaining_quantity: remaining,
        quantity_sold: sold,
        price,
        sale_amount: saleAmount
      });

      // Update or delete rider_stock row
      if (remaining <= 0) {
        await supabase.from('rider_stock').delete().eq('rider_id', rider_id).eq('product_id', item.product_id);
      } else {
        await supabase.from('rider_stock').upsert({
          rider_id,
          product_id: item.product_id,
          quantity: remaining,
          updated_at: new Date().toISOString()
        }, { onConflict: ['rider_id', 'product_id'] });
      }
    }

    // Insert single stock_opname record with details JSONB
    const opnameRecord = {
      id: uuidv4(),
      rider_id,
      admin_id: user.id,
      total_sales: totalSales,
      notes,
      details: JSON.stringify({ sales_details: salesDetails }),
      payment_method: payment_method || 'tunai',
      created_at: new Date().toISOString()
    };

    const { error: insertErr } = await supabase.from('stock_opname').insert(opnameRecord);
    if (insertErr) throw insertErr;

    res.json({ total_sales: totalSales, sales_details: salesDetails, opname_id: opnameRecord.id });
  } catch (error) {
    console.error('createStockOpname error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal merekam stock opname' });
  }
};

// Get stock opnames
exports.getStockOpnames = async (req, res) => {
  try {
    try {
      await requireAdmin(req);
    } catch (e) {
      console.error('getStockOpnames requireAdmin error:', e);
      return res.status(e.status || 401).json({ error: e.message || 'Unauthorized' });
    }
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
    console.error('getStockOpname error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat data stock opname', details: process.env.NODE_ENV === 'development' ? error : undefined });
  }
};
