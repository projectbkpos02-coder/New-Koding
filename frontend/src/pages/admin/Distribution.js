import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { productsAPI, usersAPI, distributionsAPI, riderStockAPI } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Truck, Plus, Minus, User, Package, Loader2, History, Search } from 'lucide-react';

export default function Distribution() {
  const [products, setProducts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Distribution form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderStock, setRiderStock] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchRider, setSearchRider] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ridersRes, distributionsRes] = await Promise.all([
        productsAPI.getAll(),
        usersAPI.getRiders(),
        distributionsAPI.getAll({})
      ]);
      setProducts(productsRes.data);
      setRiders(ridersRes.data);
      setDistributions(distributionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRider = async (rider) => {
    setSelectedRider(rider);
    setQuantities({});
    
    try {
      const stockRes = await riderStockAPI.getRiderStock(rider.id);
      setRiderStock(stockRes.data);
    } catch (error) {
      console.error('Error fetching rider stock:', error);
      setRiderStock([]);
    }
    
    setDialogOpen(true);
  };

  const getRiderStockForProduct = (productId) => {
    const stock = riderStock.find(s => s.product_id === productId);
    return stock?.quantity || 0;
  };

  const handleQuantityChange = (productId, value) => {
    setQuantities({ ...quantities, [productId]: Math.max(0, parseInt(value) || 0) });
  };

  const handleDistribute = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity }));

    if (items.length === 0) {
      alert('Pilih minimal 1 produk untuk distribusi');
      return;
    }

    setSaving(true);
    try {
      await distributionsAPI.create({
        rider_id: selectedRider.id,
        items,
        notes: `Distribusi ke ${selectedRider.full_name}`
      });
      setDialogOpen(false);
      setQuantities({});
      fetchData();
      alert('Distribusi berhasil!');
    } catch (error) {
      console.error('Error distributing:', error);
      alert(error.response?.data?.detail || 'Gagal melakukan distribusi');
    } finally {
      setSaving(false);
    }
  };

  // Only show users with role 'rider' for distribution
  const filteredRiders = riders
    .filter(r => r.role === 'rider')
    .filter(r => 
      r.full_name.toLowerCase().includes(searchRider.toLowerCase()) ||
      r.email.toLowerCase().includes(searchRider.toLowerCase())
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribusi</h1>
          <p className="text-gray-500">Distribusikan produk ke rider</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Riders List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Pilih Rider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari rider..."
                    value={searchRider}
                    onChange={(e) => setSearchRider(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredRiders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada rider</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRiders.map((rider) => (
                      <button
                        key={rider.id}
                        onClick={() => handleSelectRider(rider)}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {rider.avatar_url ? (
                            <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{rider.full_name}</h3>
                          <p className="text-sm text-gray-500 truncate">{rider.email}</p>
                          {rider.phone && <p className="text-xs text-gray-400">{rider.phone}</p>}
                        </div>
                        <Truck className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribution History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Distribusi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {distributions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada riwayat</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {distributions.slice(0, 20).map((dist) => (
                      <div key={dist.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">{dist.products?.name}</span>
                          <Badge>{dist.quantity} pcs</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {dist.rider?.full_name} - {formatDateTime(dist.distributed_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Distribution Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Distribusi ke {selectedRider?.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Rider Info */}
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{selectedRider?.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedRider?.email}</p>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Pilih Produk & Jumlah:</p>
                {products.filter(p => p.stock_in_warehouse > 0).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Gudang: {product.stock_in_warehouse}</span>
                        <span>|</span>
                        <span>Rider: {getRiderStockForProduct(product.id)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={quantities[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="w-16 h-8 text-center text-sm"
                        placeholder="0"
                        max={product.stock_in_warehouse}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {products.filter(p => p.stock_in_warehouse > 0).length === 0 && (
                  <p className="text-center text-gray-500 py-4">Tidak ada produk tersedia di gudang</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleDistribute} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
                Distribusikan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
