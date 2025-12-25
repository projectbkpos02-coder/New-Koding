import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { rejectsAPI } from '../../lib/api';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';

export default function Rejects() {
  const [pendingRejects, setPendingRejects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes] = await Promise.all([
        rejectsAPI.getAll('pending')
      ]);
      setPendingRejects(pendingRes.data);
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
          <h1 className="text-2xl font-bold text-gray-900">Produk Reject/Rusak</h1>
          <p className="text-gray-500">Kelola produk rusak/tidak layak jual</p>
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
      </div>
    </AdminLayout>
  );
}
