import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { productsAPI, usersAPI, riderStockAPI, stockOpnameAPI } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { ClipboardList, User, Package, Loader2, History, Search, Calculator, Check } from 'lucide-react';

export default function StockOpname() {
  const [products, setProducts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [opnameHistory, setOpnameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Opname form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderStock, setRiderStock] = useState([]);
  const [remainingQty, setRemainingQty] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [searchRider, setSearchRider] = useState('');
  const [opnameResult, setOpnameResult] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ridersRes, opnameRes] = await Promise.all([
        productsAPI.getAll(),
        usersAPI.getRiders(),
        stockOpnameAPI.getAll({})
      ]);
      setProducts(productsRes.data);
      setRiders(ridersRes.data);
      setOpnameHistory(opnameRes.data);
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
    setRemainingQty({});
    setOpnameResult(null);
    
    try {
      const stockRes = await riderStockAPI.getRiderStock(rider.id);
      setRiderStock(stockRes.data);
      
      // Pre-fill with current stock
      const initialQty = {};
      stockRes.data.forEach(s => {
        initialQty[s.product_id] = s.quantity;
      });
      setRemainingQty(initialQty);
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

  const getProductInfo = (productId) => {
    return products.find(p => p.id === productId) || {};
  };

  const handleRemainingChange = (productId, value) => {
    setRemainingQty({ ...remainingQty, [productId]: Math.max(0, parseInt(value) || 0) });
  };

  const calculateSales = () => {
    let totalSales = 0;
    const details = [];

    riderStock.forEach(stock => {
      const currentStock = stock.quantity;
      const remaining = remainingQty[stock.product_id] || 0;
      const sold = currentStock - remaining;
      
      if (sold > 0) {
        const product = getProductInfo(stock.product_id);
        const saleAmount = sold * (product.price || 0);
        totalSales += saleAmount;
        details.push({
          product_name: product.name,
          quantity_sold: sold,
          price: product.price,
          sale_amount: saleAmount
        });
      }
    });

    return { totalSales, details };
  };

  const handleStockOpname = async () => {
    const items = riderStock.map(stock => ({
      product_id: stock.product_id,
      remaining_quantity: remainingQty[stock.product_id] || 0
    }));

    if (items.length === 0) {
      alert('Tidak ada stok rider untuk di-opname');
      return;
    }

    setSaving(true);
    try {
      const result = await stockOpnameAPI.create({
        rider_id: selectedRider.id,
        items,
        notes: `Stock Opname ${selectedRider.full_name}`,
        payment_method: paymentMethod
      });
      
      setOpnameResult(result.data);
      fetchData();
    } catch (error) {
      console.error('Error stock opname:', error);
      alert(error.response?.data?.detail || 'Gagal melakukan stock opname');
    } finally {
      setSaving(false);
    }
  };

  const previewCalculation = calculateSales();

  const filteredRiders = riders.filter(r => 
    r.full_name.toLowerCase().includes(searchRider.toLowerCase()) ||
    r.email.toLowerCase().includes(searchRider.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Opname</h1>
          <p className="text-gray-500">Input sisa stok rider untuk menghitung penjualan otomatis</p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Cara Kerja Stock Opname</h3>
              <p className="text-sm text-blue-700 mt-1">
                1. Pilih rider → 2. Input sisa stok yang dibawa rider → 3. Sistem akan otomatis menghitung penjualan (Stok Awal - Sisa = Terjual)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Riders List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Pilih Rider untuk Stock Opname
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
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{rider.full_name}</h3>
                          <p className="text-sm text-gray-500 truncate">{rider.email}</p>
                        </div>
                        <ClipboardList className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Opname History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Stock Opname
                </CardTitle>
              </CardHeader>
              <CardContent>
                {opnameHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada riwayat</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {opnameHistory.slice(0, 20).map((opname) => (
                      <div key={opname.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{opname.rider?.full_name}</span>
                          <Badge variant="success">{formatCurrency(opname.total_sales)}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          oleh {opname.admin?.full_name} - {formatDateTime(opname.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stock Opname Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Stock Opname - {selectedRider?.full_name}
              </DialogTitle>
            </DialogHeader>

            {opnameResult ? (
              // Result View
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Stock Opname Berhasil!</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    Total Penjualan: {formatCurrency(opnameResult.total_sales)}
                  </p>
                </div>

                {opnameResult.sales_details?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Detail Penjualan:</h4>
                    <div className="space-y-2">
                      {opnameResult.sales_details.map((item, idx) => (
                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{item.product_name} ({item.quantity_sold} pcs)</span>
                          <span className="font-medium">{formatCurrency(item.sale_amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => { setDialogOpen(false); setOpnameResult(null); }} className="w-full">
                  Tutup
                </Button>
              </div>
            ) : (
              // Input View
              <div className="space-y-4">
                {/* Rider Info */}
                <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedRider?.full_name}</p>
                    <p className="text-sm text-gray-500">{selectedRider?.email}</p>
                  </div>
                </div>

                {/* Rider's Stock */}
                {riderStock.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Rider tidak memiliki stok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Input Sisa Stok Rider:</p>
                    {riderStock.map((stock) => {
                      const product = getProductInfo(stock.product_id);
                      const sold = stock.quantity - (remainingQty[stock.product_id] || 0);
                      return (
                        <div key={stock.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center flex-shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{product.name}</h4>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Stok Awal: {stock.quantity}</span>
                                {sold > 0 && (
                                  <Badge variant="success" className="text-xs">Terjual: {sold}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <label className="text-xs text-gray-500">Sisa:</label>
                              <Input
                                type="number"
                                value={remainingQty[stock.product_id] ?? stock.quantity}
                                onChange={(e) => handleRemainingChange(stock.product_id, e.target.value)}
                                className="w-20 h-8 text-center text-sm"
                                max={stock.quantity}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Preview */}
                {riderStock.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Preview Kalkulasi:</h4>
                    <p className="text-xl font-bold text-blue-700">
                      Total Penjualan: {formatCurrency(previewCalculation.totalSales)}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Metode Pembayaran untuk opname:</p>
                      <div className="flex gap-2">
                        <Button
                          variant={paymentMethod === 'tunai' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('tunai')}
                        >
                          Tunai
                        </Button>
                        <Button
                          variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('qris')}
                        >
                          QRIS
                        </Button>
                      </div>
                    </div>
                    {previewCalculation.details.length > 0 && (
                      <div className="mt-2 text-sm text-blue-600">
                        {previewCalculation.details.map((d, i) => (
                          <div key={i}>{d.product_name}: {d.quantity_sold} pcs = {formatCurrency(d.sale_amount)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!opnameResult && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={handleStockOpname} disabled={saving || riderStock.length === 0}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Simpan Stock Opname
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
