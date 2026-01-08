const { createClient } = require('@supabase/supabase-js');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get users list with role-based visibility
exports.getRiders = async (req, res) => {
  try {
    // Authenticate requester to decide what they can see
    const requester = await authenticateUser(req);

    // Fetch profiles and roles separately, then merge to include role info
    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, phone, avatar_url, created_at').order('full_name'),
      supabase.from('user_roles').select('user_id, role')
    ]);

    if (profilesError || rolesError) {
      console.error('GetRiders DB error:', profilesError || rolesError);
      return res.json([]);
    }

    const roleMap = {};
    (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

    let result = (profiles || []).map(p => ({
      ...p,
      role: roleMap[p.id] || 'rider'
    }));

    // Visibility rules:
    // - super_admin sees all (super_admin, admin, rider)
    // - admin sees only riders (and NOT super_admin)
    // - rider cannot access this endpoint
    if (requester.role === 'admin') {
      result = result.filter(u => (u.role || 'rider') === 'rider' && u.role !== 'super_admin');
    } else if (requester.role === 'super_admin') {
      // super_admin can see all: no filter needed
    } else {
      // rider cannot access
      return res.status(403).json({ error: 'Akses ditolak: rider tidak dapat melihat daftar user' });
    }

    res.json(result || []);
  } catch (error) {
    console.error('getRiders error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat daftar user' });
  }
};

// Update user role (super_admin or admin with restrictions)
exports.updateRole = async (req, res) => {
  try {
    const requester = await authenticateUser(req);
    const userId = req.params?.id || req.url?.split('/').pop();
    const newRole = req.query?.role || req.body?.role;

    if (!userId || !newRole) return res.status(400).json({ error: 'Missing user id or role' });

    // Fetch current role
    const { data: currentRoleData, error: currentRoleErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const currentRole = currentRoleData?.role || 'rider';

    // Permission checks
    if (requester.role === 'super_admin') {
      // super_admin can change any role (but keep basic safeguard)
    } else if (requester.role === 'admin') {
      // admin can only modify riders and cannot promote to admin/super_admin
      if (currentRole !== 'rider') return res.status(403).json({ error: 'Admin hanya dapat mengubah data rider' });
      if (newRole !== 'rider') return res.status(403).json({ error: 'Admin tidak dapat mengubah role menjadi admin atau super_admin' });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error: updateErr } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (updateErr) throw updateErr;

    res.json({ message: 'Role updated' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update role' });
  }
};

// Delete user (super_admin can delete any, admin only riders)
exports.deleteUser = async (req, res) => {
  try {
    const requester = await authenticateUser(req);
    const userId = req.params?.id || req.url?.split('/').pop();

    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const targetRole = roleData?.role || 'rider';

    if (requester.role === 'admin' && targetRole !== 'rider') {
      return res.status(403).json({ error: 'Admin hanya dapat menghapus rider' });
    }

    // Delete user role and profile
    const [{ error: delRoleErr }, { error: delProfileErr }] = await Promise.all([
      supabase.from('user_roles').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('id', userId),
    ]);

    if (delRoleErr || delProfileErr) throw delRoleErr || delProfileErr;

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete user' });
  }
};

// Get riders with performance data
exports.getRiderLeaderboard = async (req, res) => {
  try {
    await authenticateUser(req);

    // This is a complex query that joins multiple tables
    // You'll need to create a Supabase view or function for this
    const { data, error } = await supabase
      .from('rider_leaderboard')
      .select('*')
      .order('total_sales', { ascending: false });

    if (error) {
      // Fallback if view doesn't exist
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get user reports
exports.getUserReports = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const { start_date, end_date } = req.query;
    // Attempt to run the report query; if it fails (missing view/table or invalid aggregation),
    // return an empty array instead of throwing a 500.
    try {
      let query = supabase
        .from('transactions')
        .select('rider_id, profiles(full_name), sum(total_amount)');

      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data, error } = await query.order('rider_id');

      if (error) {
        console.error('UserReports query error:', error);
        return res.json([]);
      }

      return res.json(data || []);
    } catch (qerr) {
      console.error('UserReports unexpected error:', qerr);
      return res.json([]);
    }
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
