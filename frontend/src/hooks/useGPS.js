import { useEffect, useRef } from 'react';
import { gpsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useGPS() {
  const { user, isRider } = useAuth();
  const lastUpdate = useRef(null);

  useEffect(() => {
    if (!user || !isRider) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Only update if 5 minutes have passed
            const now = Date.now();
            if (lastUpdate.current && (now - lastUpdate.current) < 300000) {
              return;
            }
            
            try {
              await gpsAPI.updateLocation(latitude, longitude);
              lastUpdate.current = now;
              console.log('GPS location updated:', latitude, longitude);
            } catch (error) {
              console.error('Failed to update GPS:', error);
            }
          },
          (error) => {
            console.error('GPS error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      }
    };

    // Update on mount
    updateLocation();

    // Update every 5 minutes
    const interval = setInterval(updateLocation, 300000);

    return () => clearInterval(interval);
  }, [user, isRider]);
}
