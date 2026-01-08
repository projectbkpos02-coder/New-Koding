# 🔧 GPS Tracking - Troubleshooting & Fixes

## Issue #1: Blank White Page with "Unexpected token '<'" Error

### Root Cause
JavaScript bundles were returning HTML (404 response) instead of actual JS code.

### ✅ Fixed By
1. **Rebuilt frontend** with latest GPS API changes
2. **Copied build files** from `frontend/build/` to `public/` directory
3. **Updated file serving** to correctly handle static assets

### How to Verify
- Open Developer Tools (F12)
- Go to **Console** tab
- Should NOT see: `Uncaught SyntaxError: Unexpected token '<'`
- Go to **Network** tab
- Check `main.[hash].js` file - should be ~500KB, type `javascript`
- NOT showing 404 or HTML content

## Issue #2: Rider Data Not Appearing in GPS Maps

### Root Causes
1. **API endpoint mismatch**: Frontend calling `/api/gps/locations` but server only had `/api/gps/all`
2. **GPS data not saving**: Backend was doing INSERT instead of UPSERT (update or insert)
3. **Missing permissions**: GPS locations weren't joined with rider profile data

### ✅ Fixed By

#### 1. Updated Frontend API Endpoints
```javascript
// BEFORE (WRONG)
gpsAPI.updateLocation: () => api.post('/gps/update', ...)
gpsAPI.getAllLocations: () => api.get('/gps/locations')

// AFTER (CORRECT)
gpsAPI.updateLocation: () => api.post('/gps', ...)
gpsAPI.getAllLocations: () => api.get('/gps/all')
```

#### 2. Fixed GPS Handler to Use UPSERT
```javascript
// BEFORE: INSERT (failed if rider already had location)
await supabase.from('gps_locations').insert({...})

// AFTER: UPSERT (creates or updates)
await supabase.from('gps_locations').upsert({...})
```

#### 3. Enhanced GPS Query with Profile JOIN
```javascript
// Now returns rider profile with location
.select(`
  id, rider_id, latitude, longitude, updated_at,
  profiles:rider_id(id, full_name, email, avatar_url)
`)
```

## 📝 How to Test GPS Tracking

### Step 1: Clear Cache
```javascript
// Open browser DevTools Console and run:
localStorage.clear()
sessionStorage.clear()
window.location.reload()
```

### Step 2: Login as Rider
1. Go to app
2. Login with rider account
3. Open DevTools Console
4. Look for GPS logs like:
   ```
   [GPS] Initializing for rider: Joko Rider (uuid...)
   [GPS] Updating location: -6.200000, 106.816667 (accuracy: 15m)
   [GPS] ✓ Location updated successfully
   ```

### Step 3: Allow Geolocation
- Browser will ask permission → click "Allow"
- If not, check browser settings for blocked geolocation

### Step 4: Check Admin GPS Tracking Page
1. Login as Admin
2. Go to Admin → GPS Tracking
3. Should see:
   - Interactive map with blue markers
   - List of riders with locations
   - Last updated timestamp

## 🛠️ Debugging Commands

### Check if GPS data is saving in Supabase
```sql
-- Run in Supabase SQL Editor
SELECT 
  rider_id,
  CONCAT(latitude, ', ', longitude) as location,
  updated_at 
FROM gps_locations
ORDER BY updated_at DESC;
```

### Check API response directly
```bash
# Terminal
curl -X GET http://localhost:3000/api/gps/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor GPS updates in browser
1. Open DevTools Console
2. Filter by `[GPS]`
3. Watch for successful/failed updates

## 🔍 Console Logging

All GPS operations now log with `[GPS]` prefix:
- `[GPS] ✓` = Success
- `[GPS] ✗` = Error
- `[GPS] Initializing` = Starting GPS tracking
- `[GPS] Updating location` = Sending location to server

## 🚀 Quick Start After Fixes

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Build frontend
cd frontend && npm run build

# 3. Copy to public directory
cd .. && cp -r frontend/build/* public/

# 4. Start server
npm start

# 5. Test
# - Open http://localhost:3000
# - Login as rider
# - Check console for [GPS] logs
# - Login as admin
# - Go to GPS Tracking page
```

## 📱 Browser Requirements
- Geolocation API support (all modern browsers)
- HTTPS (production - localhost OK for development)
- GPS/Location permission granted

## 💾 Database Schema
```sql
Table: gps_locations
- id (UUID)
- rider_id (UUID, UNIQUE) ← Only 1 location per rider
- latitude (DECIMAL)
- longitude (DECIMAL)
- updated_at (TIMESTAMP)
```

## 🔗 Related Files
- Frontend API: [lib/api.js](frontend/src/lib/api.js)
- GPS Hook: [useGPS.js](frontend/src/hooks/useGPS.js)
- GPS Tracking Page: [pages/admin/GPSTracking.js](frontend/src/pages/admin/GPSTracking.js)
- Backend Handler: [lib/handlers/gps.js](lib/handlers/gps.js)
- Database Setup: [backend/gps_setup.sql](backend/gps_setup.sql)

## ❓ Still Not Working?

### GPS data not updating?
1. Check browser console for `[GPS]` errors
2. Verify geolocation permission is granted
3. Make sure you're logged in as rider
4. Check if backend `/api/gps` endpoint is working:
   ```javascript
   // In browser console
   fetch('/api/gps', {method:'POST', body:JSON.stringify({latitude:0, longitude:0})})
   ```

### Map not loading?
1. Check if admin has view access
2. Verify Leaflet CSS is loaded (DevTools → Network → CSS files)
3. Check browser console for Leaflet errors

### Static files showing 404?
1. Verify files exist: `ls -la public/static/`
2. Rebuild: `cd frontend && npm run build`
3. Copy to public: `cp -r frontend/build/* public/`

