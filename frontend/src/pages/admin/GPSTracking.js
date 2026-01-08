import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { gpsAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { MapPin, Loader2, RefreshCw, User, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function GPSTracking() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await gpsAPI.getAllLocations();
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchLocations, 300000);
    return () => clearInterval(interval);
  }, []);

  const openInMaps = (lat, lng, name) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, '_blank');
  };

  // Create custom marker icon
  const createMarkerIcon = (color = 'blue') => {
    return L.icon({
      iconUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(color)}" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // Calculate bounds to show all markers
  const calculateCenter = () => {
    if (locations.length === 0) return [0, 0];
    const avg = locations.reduce((acc, loc) => ({
      lat: acc.lat + loc.latitude,
      lng: acc.lng + loc.longitude
    }), { lat: 0, lng: 0 });
    return [avg.lat / locations.length, avg.lng / locations.length];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GPS Tracking</h1>
            <p className="text-gray-500">Pantau lokasi terakhir rider</p>
          </div>
          <Button onClick={fetchLocations} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informasi GPS</h3>
              <p className="text-sm text-blue-700 mt-1">
                Lokasi rider diperbarui setiap kali mereka membuka aplikasi. Lokasi terakhir akan selalu tersimpan sampai rider membuka aplikasi lagi.
              </p>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada data lokasi rider</p>
              <p className="text-sm text-gray-400 mt-1">Lokasi akan muncul ketika rider membuka aplikasi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openInMaps(loc.latitude, loc.longitude, loc.profiles?.full_name)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {loc.profiles?.avatar_url ? (
                        <img src={loc.profiles.avatar_url} alt={loc.profiles?.full_name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{loc.profiles?.full_name || 'Unknown'}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="success" className="text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Online
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(loc.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Map Container */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Peta Lokasi Rider
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : locations.length === 0 ? (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Belum ada data lokasi rider</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <MapContainer 
                    center={calculateCenter()} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {locations.map((loc) => (
                      <Marker 
                        key={loc.id} 
                        position={[loc.latitude, loc.longitude]}
                        icon={createMarkerIcon('#3B82F6')}
                        eventHandlers={{
                          click: () => setSelectedRider(loc)
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">{loc.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-gray-600">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</div>
                            <div className="text-gray-500 text-xs mt-1">{formatDateTime(loc.updated_at)}</div>
                            <button 
                              onClick={() => openInMaps(loc.latitude, loc.longitude, loc.profiles?.full_name)}
                              className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Buka di Google Maps →
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                
                {selectedRider && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {selectedRider.profiles?.avatar_url ? (
                          <img src={selectedRider.profiles.avatar_url} alt={selectedRider.profiles?.full_name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">{selectedRider.profiles?.full_name}</h4>
                        <p className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedRider.latitude.toFixed(6)}, {selectedRider.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Diperbarui: {formatDateTime(selectedRider.updated_at)}
                        </p>
                        <button 
                          onClick={() => openInMaps(selectedRider.latitude, selectedRider.longitude, selectedRider.profiles?.full_name)}
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          Buka di Google Maps
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
