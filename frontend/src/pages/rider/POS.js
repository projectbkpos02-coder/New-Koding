import React, { useState, useEffect } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { riderStockAPI, transactionsAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, Package, Plus, Minus, Loader2, Check, X, CreditCard, Banknote, RefreshCw, Sparkles } from 'lucide-react';

export default function RiderPOS() {
  const { user } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [transactionSuccess, setTransactionSuccess] = useState(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await riderStockAPI.getMyStock();
      setStock(response.data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const addToCart = (product) => {
    const currentQty = cart[product.product_id]?.quantity || 0;
    const maxQty = product.quantity;
    
    if (currentQty < maxQty) {
      setCart({
        ...cart,
        [product.product_id]: {
          ...product,
          quantity: currentQty + 1,
          cartQty: currentQty + 1
        }
      });
    }
  };

  const removeFromCart = (productId) => {
    const currentQty = cart[productId]?.cartQty || 0;
    if (currentQty > 1) {
      setCart({
        ...cart,
        [productId]: {
          ...cart[productId],
          cartQty: currentQty - 1
        }
      });
    } else {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    }
  };

  const clearCart = () => {
    setCart({});
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.cartQty, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.cartQty, 0);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const items = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.cartQty,
        price: item.products?.price || 0
      }));

      const result = await transactionsAPI.create({
        items,
        payment_method: paymentMethod
      });

      setTransactionSuccess(result.data);
      setCart({});
      fetchStock();
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert(error.response?.data?.detail || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setTransactionSuccess(null);
    setDialogOpen(false);
  };

  return (
    <RiderLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              POS
            </h1>
            <p className="text-sm text-muted-foreground">Point of Sale</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchStock} variant="outline" size="sm" disabled={loading} className="hover-lift">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {cartCount > 0 && (
              <Button onClick={() => setDialogOpen(true)} className="relative bg-gradient-primary hover:opacity-90 shadow-glow">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {formatCurrency(cartTotal)}
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white text-xs rounded-full flex items-center justify-center animate-bounce-in shadow-md">
                  {cartCount}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Stock Info */}
        <div className="p-3 bg-primary/10 rounded-xl text-sm text-primary border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Stok tersedia: <strong>{stock.length}</strong> produk</span>
          </div>
          <Badge variant="secondary" className="bg-secondary/20 text-secondary">
            {stock.reduce((s, p) => s + p.quantity, 0)} item
          </Badge>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memuat stok...</p>
          </div>
        ) : stock.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Tidak ada stok</p>
              <p className="text-sm text-muted-foreground">Hubungi admin untuk distribusi produk</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stock.map((item, index) => {
              const inCart = cart[item.product_id]?.cartQty || 0;
              const availableQty = item.quantity - inCart;
              
              return (
                <Card 
                  key={item.id} 
                  className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 animate-fade-in-up hover-lift"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products?.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                    {inCart > 0 && (
                      <Badge className="absolute top-2 right-2 bg-primary shadow-md animate-scale-in">{inCart} di keranjang</Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate text-foreground">{item.products?.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-primary font-bold text-sm">
                        {formatCurrency(item.products?.price || 0)}
                      </p>
                      <Badge variant={availableQty <= 5 ? 'destructive' : 'success'} className="text-xs">
                        Stok: {availableQty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {inCart > 0 ? (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="flex-1 text-center font-bold text-foreground">{inCart}</span>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-gradient-primary hover:opacity-90"
                            onClick={() => addToCart(item)}
                            disabled={availableQty <= 0}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full h-8 rounded-lg bg-gradient-secondary hover:opacity-90"
                          onClick={() => addToCart(item)}
                          disabled={availableQty <= 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Tambah
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Checkout Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            {transactionSuccess ? (
              // Success View
              <div className="text-center py-6 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-secondary animate-bounce-in">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Transaksi Berhasil!</h2>
                <p className="text-3xl font-bold text-secondary mb-2 animate-scale-in">
                  {formatCurrency(transactionSuccess.total)}
                </p>
                <p className="text-sm text-muted-foreground mb-6">ID: {transactionSuccess.transaction_id.slice(0, 8)}</p>
                <Button onClick={handleNewTransaction} className="w-full bg-gradient-primary hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Transaksi Baru
                </Button>
              </div>
            ) : (
              // Checkout View
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    Keranjang Belanja
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                    {cartItems.map((item, index) => (
                      <div 
                        key={item.product_id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-xl animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center overflow-hidden">
                            {item.products?.image_url ? (
                              <img src={item.products.image_url} alt={item.products?.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{item.products?.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.products?.price || 0)} x {item.cartQty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{formatCurrency((item.products?.price || 0) * item.cartQty)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const newCart = { ...cart };
                              delete newCart[item.product_id];
                              setCart(newCart);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Metode Pembayaran:</p>
                    <div className="flex gap-2">
                      <Button
                        variant={paymentMethod === 'tunai' ? 'default' : 'outline'}
                        className={`flex-1 ${paymentMethod === 'tunai' ? 'bg-gradient-secondary hover:opacity-90' : ''}`}
                        onClick={() => setPaymentMethod('tunai')}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Tunai
                      </Button>
                      <Button
                        variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                        className={`flex-1 ${paymentMethod === 'transfer' ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                        onClick={() => setPaymentMethod('transfer')}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col gap-2">
                  <Button onClick={handleCheckout} disabled={processing} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bayar {formatCurrency(cartTotal)}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearCart} className="w-full">
                    Kosongkan Keranjang
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RiderLayout>
  );
}
