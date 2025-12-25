import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, returnsAPI, rejectsAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Undo2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [pendingRejects, setPendingRejects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, returnsRes, rejectsRes] = await Promise.all([
        reportsAPI.getSummary({}),
        returnsAPI.getAll('pending'),
        rejectsAPI.getAll('pending')
      ]);
      setStats(summaryRes.data);
      setPendingReturns(returnsRes.data);
      setPendingRejects(rejectsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Penjualan',
      value: stats ? formatCurrency(stats.total_sales) : '-',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Total Transaksi',
      value: stats?.total_transactions || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Kerugian',
      value: stats ? formatCurrency(stats.total_loss) : '-',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Profit Bersih',
      value: stats ? formatCurrency(stats.net_profit) : '-',
      icon: Package,
      color: 'bg-purple-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Ringkasan sistem POS Rider</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Returns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Undo2 className="w-5 h-5" />
                Return Menunggu
                {pendingReturns.length > 0 && (
                  <Badge variant="warning">{pendingReturns.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReturns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada return menunggu</p>
              ) : (
                <div className="space-y-3">
                  {pendingReturns.slice(0, 5).map((ret) => (
                    <div key={ret.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ret.products?.name}</p>
                        <p className="text-sm text-gray-500">{ret.profiles?.full_name} - {ret.quantity} pcs</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Rejects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Reject Menunggu
                {pendingRejects.length > 0 && (
                  <Badge variant="destructive">{pendingRejects.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRejects.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada reject menunggu</p>
              ) : (
                <div className="space-y-3">
                  {pendingRejects.slice(0, 5).map((rej) => (
                    <div key={rej.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{rej.products?.name}</p>
                        <p className="text-sm text-gray-500">{rej.profiles?.full_name} - {rej.quantity} pcs</p>
                      </div>
                      <Badge variant="destructive">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
