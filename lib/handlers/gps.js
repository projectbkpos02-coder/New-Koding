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

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('gps_locations')
      .upsert({
        rider_id: user.id,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'rider_id'
      });

    if (error) throw error;

    res.json({ message: 'Lokasi berhasil diupdate', data });
  } catch (error) {
    console.error('updateGPS error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal mengupdate lokasi' });
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
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('getRiderGPS error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat lokasi rider' });
  }
};

// Get all riders' current GPS (admin only)
exports.getAllRidersGPS = async (req, res) => {
  try {
    await requireAdmin(req);

    // Get all GPS locations with joined rider profile data
    const { data, error } = await supabase
      .from('gps_locations')
      .select(`
        id,
        rider_id,
        latitude,
        longitude,
        updated_at,
        profiles(id, full_name, email, avatar_url)
      `);

    if (error) {
      // Handle case where table doesn't exist or is empty
      console.error('getAllRidersGPS supabase error:', error);
      if (error.code === 'PGRST116' || (error.message && (error.message.includes('relation') || error.message.includes('does not exist')))) {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('getAllRidersGPS error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Gagal memuat lokasi rider' });
  }
};
