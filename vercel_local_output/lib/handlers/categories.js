const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const requireAdmin = async (req) => {
  const user = await authenticateUser(req);
  if (!['admin', 'super_admin'].includes(user.role)) {
    throw { status: 403, message: 'Admin access required' };
  }
  return user;
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    await authenticateUser(req);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    await requireAdmin(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name required' });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: uuidv4(),
        name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.requireAdmin = requireAdmin;
