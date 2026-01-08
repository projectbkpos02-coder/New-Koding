const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('./auth');
const { requireAdmin } = require('./categories');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Update GPS location
exports.updateGPS = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const { error } = await supabase.from('gps_locations').insert({
      id: uuidv4(),
      rider_id: user.id,
      latitude,
      longitude,
      recorded_at: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get rider's recent GPS locations
exports.getRiderGPS = async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { rider_id } = req.params;

    // Only allow riders to see their own GPS or admins to see any
    if (!['admin', 'super_admin'].includes(user.role) && user.id !== rider_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('gps_locations')
      .select('*')
      .eq('rider_id', rider_id)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Get all riders' current GPS (admin only)
exports.getAllRidersGPS = async (req, res) => {
  try {
    await requireAdmin(req);

    const { data, error } = await supabase.rpc('get_latest_rider_gps');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
