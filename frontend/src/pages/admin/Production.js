import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { productsAPI, productionsAPI } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Plus, Minus, Factory, Package, Loader2, History } from 'lucide-react';

export default function Production() {
  const [products, setProducts] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, productionsRes] = await Promise.all([
        productsAPI.getAll(),
        productionsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setProductions(productionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuantityChange = (productId, value) => {
    setQuantities({ ...quantities, [productId]: Math.max(0, parseInt(value) || 0) });
  };

  const handleAddProduction = async (product) => {
    const qty = quantities[product.id];
    if (!qty || qty <= 0) {
      alert('Masukkan jumlah yang valid');
      return;
    }

    setSaving(true);
    try {
      await productionsAPI.create({
        product_id: product.id,
        quantity: qty,
        notes: `Produksi ${product.name}`
      });
      setQuantities({ ...quantities, [product.id]: 0 });
      fetchData();
    } catch (error) {
      console.error('Error adding production:', error);
      alert('Gagal menambah produksi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produksi</h1>
          <p className="text-gray-500">Tambah stok produk ke gudang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5" />
                  Tambah Stok Gudang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada produk</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={product.stock_in_warehouse < product.min_stock ? 'destructive' : 'success'}>
                              Stok: {product.stock_in_warehouse}
                            </Badge>
                            <span className="text-sm text-gray-500">{formatCurrency(product.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={quantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-20 text-center"
                            placeholder="0"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 0) + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleAddProduction(product)}
                            disabled={saving || !quantities[product.id]}
                            size="sm"
                          >
                            Tambah
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Production History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Produksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada riwayat</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {productions.map((prod) => (
                      <div key={prod.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{prod.products?.name}</span>
                          <Badge variant="success">+{prod.quantity}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {prod.profiles?.full_name} - {formatDateTime(prod.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
