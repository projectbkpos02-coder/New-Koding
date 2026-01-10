import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { rejectsAPI, usersAPI, riderStockAPI } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';

export default function Rejects() {
  const [pendingRejects, setPendingRejects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [riders, setRiders] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderStock, setRiderStock] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [rejectQty, setRejectQty] = useState(0);
  const [rejectNote, setRejectNote] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes] = await Promise.all([
        rejectsAPI.getAll('pending')
      ]);
      setPendingRejects(pendingRes.data);
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
    if (!window.confirm('Approve reject ini? Produk akan dihitung sebagai kerugian.')) return;
    
    setProcessing({ ...processing, [id]: 'approve' });
    try {
      await rejectsAPI.approve(id);
      fetchData();
    } catch (error) {
      console.error('Error approving reject:', error);
      alert('Gagal approve reject');
    } finally {
      setProcessing({ ...processing, [id]: null });
    }
  };

  const openCreateReject = () => setCreateDialogOpen(true);

  const handleSelectRider = async (rider) => {
    setSelectedRider(rider);
    setSelectedProductId(null);
    setRejectQty(0);
    setRejectNote('');
    try {
      const stockRes = await riderStockAPI.getRiderStock(rider.id);
      setRiderStock(stockRes.data || []);
    } catch (e) {
      console.error('Error fetching rider stock:', e);
      setRiderStock([]);
    }
  };

  const setQuickReason = (reason) => {
    setRejectNote(reason);
  };

  const handleCreateReject = async () => {
    if (!selectedRider || !selectedProductId || !rejectQty || rejectQty <= 0) return alert('Pilih rider, produk, dan jumlah');
    if (!rejectNote || rejectNote.trim() === '') return alert('Keterangan reject wajib diisi');

    try {
      await rejectsAPI.create({ rider_id: selectedRider.id, product_id: selectedProductId, quantity: rejectQty, notes: rejectNote });
      setCreateDialogOpen(false);
      fetchData();
      alert('Permintaan reject dibuat');
    } catch (e) {
      console.error('Error creating reject:', e);
      alert(e.response?.data?.error || 'Gagal membuat reject');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Tolak permintaan reject ini?')) return;
    
    setProcessing({ ...processing, [id]: 'reject' });
    try {
      await rejectsAPI.reject(id);
      fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Gagal reject');
    } finally {
      setProcessing({ ...processing, [id]: null });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reject Rider</h1>
          <p className="text-gray-500">Buat dan kelola permintaan reject untuk rider</p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Reject/Produk Rusak</h3>
              <p className="text-sm text-red-700 mt-1">
                Produk reject adalah produk yang rusak/tidak layak jual. Setelah approve, produk akan dihapus dari stok rider dan dihitung sebagai <strong>kerugian (loss)</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={openCreateReject}>Buat Reject</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Permintaan Reject
              {pendingRejects.length > 0 && (
                <Badge variant="destructive">{pendingRejects.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : pendingRejects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Tidak ada permintaan reject</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRejects.map((rej) => (
                  <div key={rej.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rej.products?.name}</h3>
                        <Badge variant="destructive">{rej.quantity} pcs</Badge>
                        {rej.products?.price && (
                          <Badge variant="outline" className="text-red-600">
                            Loss: {formatCurrency(rej.quantity * rej.products.price)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Dari: {rej.profiles?.full_name} | {formatDateTime(rej.created_at)}
                      </p>
                      {rej.notes && (
                        <p className="text-sm text-gray-500 mt-1">Catatan: {rej.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(rej.id)}
                        disabled={processing[rej.id]}
                      >
                        {processing[rej.id] === 'reject' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleApprove(rej.id)}
                        disabled={processing[rej.id]}
                      >
                        {processing[rej.id] === 'approve' ? (
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

        {/* Create Reject Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Permintaan Reject</DialogTitle>
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
                  <p className="text-sm font-medium">Pilih Produk & Jumlah</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riderStock.length === 0 && <p className="text-sm text-gray-500">Pilih rider untuk melihat stock</p>}
                    {riderStock.map(s => (
                      <div key={s.product_id} className={`flex items-center justify-between p-2 rounded ${selectedProductId === s.product_id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div>
                          <div className="font-medium">{s.products?.name}</div>
                          <div className="text-xs text-gray-400">Stok: {s.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" className="w-20" value={selectedProductId === s.product_id ? rejectQty : ''} onChange={(e) => { setSelectedProductId(s.product_id); setRejectQty(Math.max(0, parseInt(e.target.value) || 0)); }} />
                          <Button size="sm" onClick={() => { setSelectedProductId(s.product_id); setRejectQty(Math.min(s.quantity || 0, (rejectQty || 0) + 1)); }}>+1</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Keterangan / Alasan</p>
                <div className="flex gap-2 mt-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => setQuickReason('Produk rusak')}>Produk rusak</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickReason('Produk kadaluarsa/cacat')}>Kadaluarsa/Cacat</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickReason('Produk tumpah')}>Produk tumpah</Button>
                </div>
                <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Keterangan reject..." />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleCreateReject}>Buat Reject</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
