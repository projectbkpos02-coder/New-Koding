import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { returnsAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Undo2, Check, X, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function Returns() {
  const [pendingReturns, setPendingReturns] = useState([]);
  const [approvedReturns, setApprovedReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes] = await Promise.all([
        returnsAPI.getAll('pending')
      ]);
      setPendingReturns(pendingRes.data);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Produk</h1>
          <p className="text-gray-500">Kelola pengembalian produk dari rider ke gudang</p>
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
      </div>
    </AdminLayout>
  );
}
