const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get all products
exports.getProducts = async (req, res) => {
  try {
    await authenticateUser(req);

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name');

    if (error) throw error;

    const products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      hpp: p.hpp || 0,
      stock_in_warehouse: p.stock_in_warehouse || 0,
      category_id: p.category_id,
      category_name: p.categories?.name,
      image_url: p.image_url,
      min_stock: p.min_stock || 10,
      created_at: p.created_at,
    }));

    res.json(products);
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat produk' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    await requireAdmin(req);
    const { name, sku, price, hpp = 0, category_id, image_url, min_stock = 10 } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price required' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        id: uuidv4(),
        name,
        sku,
        price,
        hpp,
        stock_in_warehouse: 0,
        category_id,
        image_url,
        min_stock,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal membuat produk' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;
    const { name, sku, price, hpp, category_id, image_url, min_stock } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = price;
    if (hpp !== undefined) updateData.hpp = hpp;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (min_stock !== undefined) updateData.min_stock = min_stock;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal mengupdate produk' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal menghapus produk' });
  }
};
