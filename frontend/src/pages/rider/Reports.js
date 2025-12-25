import React, { useState, useEffect } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, transactionsAPI } from '../../lib/api';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, TrendingUp, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function RiderReports() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [summaryRes, transRes] = await Promise.all([
        reportsAPI.getSummary(params),
        transactionsAPI.getAll(params)
      ]);
      setSummary(summaryRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    
    switch(preset) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        start = new Date(today.setMonth(today.getMonth() - 1));
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <RiderLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Saya</h1>
          <p className="text-sm text-gray-500">Ringkasan penjualan Anda</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={() => setPreset('today')}>Hari Ini</Button>
              <Button size="sm" variant="outline" onClick={() => setPreset('week')}>7 Hari</Button>
              <Button size="sm" variant="outline" onClick={() => setPreset('month')}>30 Hari</Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={fetchData}>Filter</Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Penjualan</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(summary?.total_sales || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Transaksi</p>
                      <p className="text-lg font-bold text-blue-600">{summary?.total_transactions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Riwayat Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 20).map((trans) => (
                      <div key={trans.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{formatDateTime(trans.created_at)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">{trans.payment_method}</Badge>
                          </div>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(trans.total_amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RiderLayout>
  );
}
