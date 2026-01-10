import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { returnsAPI, usersAPI, riderStockAPI } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { formatDateTime } from '../../lib/utils';
import { Undo2, Check, X, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function Returns() {
  const [pendingReturns, setPendingReturns] = useState([]);
  const [approvedReturns, setApprovedReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [riders, setRiders] = useState([]);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderStock, setRiderStock] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes] = await Promise.all([
        returnsAPI.getAll('pending')
      ]);
      setPendingReturns(pendingRes.data);
      // fetch riders for admin return creation
      const ridersRes = await usersAPI.getRiders();
      setRiders(ridersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    setProcessing({ ...processing, [id]: 'approve' });
    try {
      await returnsAPI.approve(id);
      fetchData();
    } catch (error) {
      console.error('Error approving return:', error);
      alert('Gagal approve return');
    } finally {
      setProcessing({ ...processing, [id]: null });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Tolak return ini?')) return;
    
    setProcessing({ ...processing, [id]: 'reject' });
    try {
      await returnsAPI.reject(id);
      fetchData();
    } catch (error) {
      console.error('Error rejecting return:', error);
      alert('Gagal reject return');
    } finally {
      setProcessing({ ...processing, [id]: null });
    }
  };

  const openCreateReturn = async () => {
    setReturnDialogOpen(true);
  };

  const handleSelectRider = async (rider) => {
    setSelectedRider(rider);
    setReturnQuantities({});
    try {
      const stockRes = await riderStockAPI.getRiderStock(rider.id);
      setRiderStock(stockRes.data || []);
    } catch (e) {
      console.error('Error fetching rider stock:', e);
      setRiderStock([]);
    }
  };

  const handleReturnAll = async () => {
    if (!selectedRider) return alert('Pilih rider terlebih dahulu');
    if (!window.confirm(`Buat return untuk semua produk rider ${selectedRider.full_name}?`)) return;

    const items = riderStock.map(s => ({ product_id: s.product_id, quantity: s.quantity, notes: 'Sisa penjualan harian' }));
    if (items.length === 0) return alert('Tidak ada stock untuk dikembalikan');

    try {
      await returnsAPI.create({ rider_id: selectedRider.id, items, notes: 'Sisa penjualan harian' });
      setReturnDialogOpen(false);
      fetchData();
      alert('Permintaan return dibuat untuk semua produk');
    } catch (e) {
      console.error('Error creating bulk return:', e);
      alert('Gagal membuat return');
    }
  };

  const handleCreateReturns = async () => {
    if (!selectedRider) return alert('Pilih rider terlebih dahulu');
    const items = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity, notes: 'Sisa penjualan harian' }));
    if (items.length === 0) return alert('Pilih minimal 1 produk untuk return');

    try {
      await returnsAPI.create({ rider_id: selectedRider.id, items, notes: 'Sisa penjualan harian' });
      setReturnDialogOpen(false);
      fetchData();
      alert('Permintaan return dibuat');
    } catch (e) {
      console.error('Error creating returns:', e);
      alert('Gagal membuat return');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Rider</h1>
          <p className="text-gray-500">Buat dan kelola return yang diajukan untuk rider</p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Undo2 className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Return Produk</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Return adalah pengembalian produk yang masih layak jual dari rider ke gudang. Stok akan dikembalikan ke gudang setelah approve.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={openCreateReturn}>Buat Return</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5" />
              Permintaan Return
              {pendingReturns.length > 0 && (
                <Badge variant="warning">{pendingReturns.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : pendingReturns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Undo2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Tidak ada permintaan return</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReturns.map((ret) => (
                  <div key={ret.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{ret.products?.name}</h3>
                        <Badge>{ret.quantity} pcs</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Dari: {ret.profiles?.full_name} | {formatDateTime(ret.returned_at)}
                      </p>
                      {ret.notes && (
                        <p className="text-sm text-gray-500 mt-1">Catatan: {ret.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleReject(ret.id)}
                        disabled={processing[ret.id]}
                      >
                        {processing[ret.id] === 'reject' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(ret.id)}
                        disabled={processing[ret.id]}
                      >
                        {processing[ret.id] === 'approve' ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Return untuk Rider</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium">Pilih Rider</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riders.filter(r => r.role === 'rider').map(r => (
                      <button key={r.id} onClick={() => handleSelectRider(r)} className={`w-full text-left p-2 rounded ${selectedRider?.id === r.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                        {r.full_name} <div className="text-xs text-gray-400">{r.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Rider Stock</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riderStock.length === 0 && <p className="text-sm text-gray-500">Pilih rider untuk melihat stock</p>}
                    {riderStock.map(s => (
                      <div key={s.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{s.products?.name}</div>
                          <div className="text-xs text-gray-400">Stok: {s.quantity}</div>
                        </div>
                        <Input type="number" value={returnQuantities[s.product_id] || ''} onChange={(e) => setReturnQuantities({ ...returnQuantities, [s.product_id]: Math.max(0, parseInt(e.target.value) || 0) })} className="w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Batal</Button>
                <Button onClick={handleReturnAll}>Return Semua</Button>
                <Button onClick={handleCreateReturns}>Buat Return</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
