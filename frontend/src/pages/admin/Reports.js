import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, transactionsAPI, usersAPI } from '../../lib/api';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/utils';
import { BarChart3, Calendar, Download, User, TrendingUp, ShoppingCart, AlertTriangle, Loader2, FileText, TrendingDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [detailedReport, setDetailedReport] = useState(null);
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

      const [summaryRes, leaderboardRes, transactionsRes, ridersRes, detailedRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getLeaderboard(params),
        transactionsAPI.getAll(params),
        usersAPI.getRiders(),
        reportsAPI.getDetailed(params)
      ]);
      
      setSummary(summaryRes.data);
      setLeaderboard(leaderboardRes.data);
      setTransactions(transactionsRes.data);
      setRiders(ridersRes.data);
      setDetailedReport(detailedRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedRider]);

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

  const handleDownloadExcel = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedRider) params.rider_id = selectedRider;
      
      const response = await reportsAPI.exportExcel(params);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.tsv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Gagal mengunduh laporan. Pastikan ada data untuk didownload.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedRider) params.rider_id = selectedRider;
      
      const response = await reportsAPI.exportPDF(params);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh laporan PDF');
    }
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
      case 'year':
        start = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      default:
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
            <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
            <p className="text-gray-500">Ringkasan penjualan, transaksi, dan performa rider dengan analisis laba rugi</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Cetak
            </Button>
            <Button onClick={handleDownloadExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
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
                <Button size="sm" variant="outline" onClick={() => setPresetDate('year')}>1 Tahun</Button>
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
                      <p className="text-sm font-medium text-gray-500">Gross Profit</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(detailedReport?.summary?.gross_profit || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                      <p className="text-2xl font-bold text-purple-600">{(detailedReport?.summary?.profit_margin || 0).toFixed(2)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="print:hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                <TabsTrigger value="payment">Metode Pembayaran</TabsTrigger>
                <TabsTrigger value="leaderboard">Performa Rider</TabsTrigger>
                <TabsTrigger value="transactions">Transaksi Detail</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Ringkasan Penjualan & Laba Rugi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Penjualan (Revenue)</p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(detailedReport?.summary?.total_revenue || 0)}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Biaya/HPP</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(detailedReport?.summary?.total_cost || 0)}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Gross Profit (Laba Kotor)</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(detailedReport?.summary?.gross_profit || 0)}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Profit Margin</p>
                          <p className="text-2xl font-bold text-purple-600">{(detailedReport?.summary?.profit_margin || 0).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Methods Tab */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Ringkasan Metode Pembayaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-600 font-medium">💳 QRIS</p>
                          <p className="text-3xl font-bold text-blue-700 mt-2">{formatCurrency(detailedReport?.payment_breakdown?.qris || 0)}</p>
                          <p className="text-sm text-blue-600 mt-1">
                            {detailedReport?.summary?.total_sales > 0 
                              ? ((detailedReport?.payment_breakdown?.qris / detailedReport?.summary?.total_sales) * 100).toFixed(1)
                              : 0}% dari total
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                          <p className="text-sm text-green-600 font-medium">💵 Tunai</p>
                          <p className="text-3xl font-bold text-green-700 mt-2">{formatCurrency(detailedReport?.payment_breakdown?.tunai || 0)}</p>
                          <p className="text-sm text-green-600 mt-1">
                            {detailedReport?.summary?.total_sales > 0 
                              ? ((detailedReport?.payment_breakdown?.tunai / detailedReport?.summary?.total_sales) * 100).toFixed(1)
                              : 0}% dari total
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                        <p className="text-sm text-gray-600 font-medium">📊 Total Penjualan</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(detailedReport?.payment_breakdown?.total || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performa Per Rider
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(detailedReport?.rider_breakdown || []).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Tidak ada data rider</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Rider</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Transaksi</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">QRIS</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Tunai</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Profit</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Margin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(detailedReport?.rider_breakdown || []).map((rider, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{rider.rider_name}</td>
                                <td className="px-4 py-3 text-right">{rider.transactions_count}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(rider.qris || 0)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(rider.tunai || 0)}</td>
                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(rider.total_sales || 0)}</td>
                                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                  {formatCurrency((rider.revenue - rider.cost) || 0)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">
                                  {rider.revenue > 0 ? (((rider.revenue - rider.cost) / rider.revenue) * 100).toFixed(2) : 0}%
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

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Detail Transaksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(transactions || []).length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Tanggal</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Rider</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Metode</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((t) => (
                              <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3">{t.profiles?.full_name || '-'}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={t.payment_method === 'qris' ? 'secondary' : 'default'}>
                                    {t.payment_method === 'qris' ? 'QRIS' : 'Tunai'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(t.total_amount || 0)}</td>
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
