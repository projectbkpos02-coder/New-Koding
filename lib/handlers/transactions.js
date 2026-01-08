const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create transaction (POS)
exports.createTransaction = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { items, payment_method = 'tunai', notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    let totalAmount = 0;

    // Validate and prepare items
    for (const item of items) {
      // Check rider stock
      const { data: stock } = await supabase
        .from('rider_stock')
        .select('quantity')
        .eq('rider_id', user.id)
        .eq('product_id', item.product_id)
        .single();

      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      totalAmount += item.price * item.quantity;
    }

    // Create transaction
    const transactionId = uuidv4();
    const { error: transError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        rider_id: user.id,
        total_amount: totalAmount,
        payment_method,
        notes,
        created_at: new Date().toISOString(),
      });

    if (transError) throw transError;

    // Create transaction items and update stock
    for (const item of items) {
      // Insert transaction item
      const { error: itemError } = await supabase
        .from('transaction_items')
        .insert({
          id: uuidv4(),
          transaction_id: transactionId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        });

      if (itemError) throw itemError;

      // Update rider stock
      const { data: stock } = await supabase
        .from('rider_stock')
        .select('quantity')
        .eq('rider_id', user.id)
        .eq('product_id', item.product_id)
        .single();

      const newQty = stock.quantity - item.quantity;

      if (newQty <= 0) {
        const { error: deleteError } = await supabase
          .from('rider_stock')
          .delete()
          .eq('rider_id', user.id)
          .eq('product_id', item.product_id);

        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from('rider_stock')
          .update({ quantity: newQty })
          .eq('rider_id', user.id)
          .eq('product_id', item.product_id);

        if (updateError) throw updateError;
      }
    }

    res.json({ message: 'Transaction successful', transaction_id: transactionId, total: totalAmount });
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memproses transaksi' });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { rider_id, start_date, end_date } = req.query;

    let query;

    if (['admin', 'super_admin'].includes(user.role)) {
      query = supabase.from('transactions').select('*, profiles(full_name)');
      if (rider_id) {
        query = query.eq('rider_id', rider_id);
      }
    } else {
      query = supabase
        .from('transactions')
        .select('*')
        .eq('rider_id', user.id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat transaksi' });
  }
};

// Get transaction detail
exports.getTransactionDetail = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { id } = req.params;

    // Get transaction
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single();

    if (transError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get items
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*, products(name)')
      .eq('transaction_id', id);

    if (itemsError) throw itemsError;

    res.json({ ...transaction, items: items || [] });
  } catch (error) {
    console.error('getTransactionDetail error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat detail transaksi' });
  }
};
