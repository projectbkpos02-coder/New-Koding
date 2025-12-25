import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, transactionsAPI, usersAPI } from '../../lib/api';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/utils';
import { BarChart3, Calendar, Download, User, TrendingUp, ShoppingCart, AlertTriangle, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [riders, setRiders] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRider, setSelectedRider] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedRider) params.rider_id = selectedRider;

      const [summaryRes, leaderboardRes, transactionsRes, ridersRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getLeaderboard(params),
        transactionsAPI.getAll(params),
        usersAPI.getRiders()
      ]);
      
      setSummary(summaryRes.data);
      setLeaderboard(leaderboardRes.data);
      setTransactions(transactionsRes.data);
      setRiders(ridersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedRider('');
    fetchData();
  };

  const handlePrint = () => {
    window.print();
  };

  const setPresetDate = (preset) => {
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
            <p className="text-gray-500">Laporan penjualan, transaksi, dan performa rider</p>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700">Mulai</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sampai</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rider</label>
                <select
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  className="w-48 h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Rider</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>{rider.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPresetDate('today')}>Hari Ini</Button>
                <Button size="sm" variant="outline" onClick={() => setPresetDate('week')}>7 Hari</Button>
                <Button size="sm" variant="outline" onClick={() => setPresetDate('month')}>30 Hari</Button>
              </div>
              <Button onClick={handleFilter}>Filter</Button>
              <Button variant="outline" onClick={handleReset}>Reset</Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Penjualan</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.total_sales || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Transaksi</p>
                      <p className="text-2xl font-bold text-gray-900">{summary?.total_transactions || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Kerugian</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.total_loss || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profit Bersih</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary?.net_profit || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="leaderboard" className="print:hidden">
              <TabsList>
                <TabsTrigger value="leaderboard">Leaderboard Rider</TabsTrigger>
                <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard">
                <Card>
                  <CardHeader>
                    <CardTitle>Leaderboard Rider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboard.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Tidak ada data</p>
                    ) : (
                      <div className="space-y-3">
                        {leaderboard.map((rider, index) => (
                          <div key={rider.rider_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-orange-400 text-orange-900' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {rider.avatar_url ? (
                                <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <User className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{rider.full_name}</h3>
                              <p className="text-sm text-gray-500">{rider.total_transactions} transaksi</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{formatCurrency(rider.total_sales)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Riwayat Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Tidak ada transaksi</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-500">Tanggal</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">Rider</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">Metode</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.slice(0, 50).map((trans) => (
                              <tr key={trans.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm">{formatDateTime(trans.created_at)}</td>
                                <td className="py-3 px-4 text-sm">{trans.profiles?.full_name || '-'}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="secondary" className="capitalize">
                                    {trans.payment_method}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                  {formatCurrency(trans.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Print Version - Leaderboard */}
            <div className="hidden print:block">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard Rider</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Rank</th>
                        <th className="text-left py-2">Rider</th>
                        <th className="text-right py-2">Transaksi</th>
                        <th className="text-right py-2">Total Penjualan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((rider, index) => (
                        <tr key={rider.rider_id} className="border-b">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">{rider.full_name}</td>
                          <td className="py-2 text-right">{rider.total_transactions}</td>
                          <td className="py-2 text-right">{formatCurrency(rider.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
