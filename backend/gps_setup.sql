-- =====================================================
-- GPS LOCATIONS - FIX: Ensure UNIQUE on rider_id is DEFERRABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing constraint if exists
ALTER TABLE gps_locations DROP CONSTRAINT IF EXISTS gps_locations_rider_id_key;

-- Add back with DEFERRABLE support for upsert
ALTER TABLE gps_locations 
ADD CONSTRAINT gps_locations_rider_id_unique 
UNIQUE (rider_id) DEFERRABLE INITIALLY DEFERRED;

-- =====================================================
-- Optional: Create trigger to auto-update timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_gps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gps_locations_update_timestamp ON gps_locations;
CREATE TRIGGER gps_locations_update_timestamp
BEFORE UPDATE ON gps_locations
FOR EACH ROW
EXECUTE FUNCTION update_gps_timestamp();

-- =====================================================
-- Success! GPS table is now properly configured
-- =====================================================
