import { useEffect, useRef } from 'react';
import { gpsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useGPS() {
  const { user, isRider } = useAuth();
  const lastUpdate = useRef(null);
  const locationAttempts = useRef(0);

  useEffect(() => {
    if (!user || !isRider) {
      console.log('[GPS] Skipped - User not rider or not authenticated');
      return;
    }

    const updateLocation = () => {
      if (!navigator.geolocation) {
        console.error('[GPS] Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Check if enough time has passed since last update
          const now = Date.now();
          if (lastUpdate.current && (now - lastUpdate.current) < 300000) {
            console.log('[GPS] Skipped - Updated less than 5 minutes ago');
            return;
          }
          
          try {
            console.log(`[GPS] Updating location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy}m)`);
            await gpsAPI.updateLocation(latitude, longitude);
            lastUpdate.current = now;
            locationAttempts.current = 0;
            console.log('[GPS] ✓ Location updated successfully');
          } catch (error) {
            locationAttempts.current++;
            console.error(`[GPS] ✗ Failed to update (attempt ${locationAttempts.current}):`, error.message);
            
            // Retry after 30 seconds if failed
            if (locationAttempts.current < 3) {
              setTimeout(updateLocation, 30000);
            }
          }
        },
        (error) => {
          console.error('[GPS] ✗ Geolocation error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    };

    console.log(`[GPS] Initializing for rider: ${user?.full_name} (${user?.id})`);

    // Update immediately on mount
    updateLocation();

    // Update every 5 minutes
    const interval = setInterval(updateLocation, 300000);

    return () => clearInterval(interval);
  }, [user, isRider]);
}
