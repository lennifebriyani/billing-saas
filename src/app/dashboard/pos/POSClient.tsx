'use client';

import { useState, useEffect } from 'react';
import { getActiveProducts, createOrder, CartItem } from './actions';
import ReceiptModal from './ReceiptModal'; // Import ReceiptModal

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  type: string;
}

export default function POSClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastCart, setLastCart] = useState<CartItem[]>([]); // Menyimpan snapshot keranjang terakhir untuk cetak struk
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MANUAL_TRANSFER' | 'QRIS'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false); // State kontrol modal struk

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getActiveProducts();
    setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.itemId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Stok item ini telah mencapai batas maksimum.');
          return prev;
        }
        return prev.map((item) =>
          item.itemId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        { itemId: product.id, name: product.name, price: Number(product.price), quantity: 1 },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantity: qty } : item))
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setMessage(null);

    const paid = amountPaid > 0 ? amountPaid : totalAmount;

    const res = await createOrder(cart, paymentMethod, paid);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Transaksi berhasil disimpan!' });
      setLastCart([...cart]); // Simpan copy isi keranjang untuk struk
      setShowReceipt(true);   // Buka modal cetak struk
      setCart([]);
      setAmountPaid(0);
      fetchProducts();
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kolom Kiri: Daftar Produk */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Kasir (Point of Sale)</h1>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat katalog produk...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-4 border rounded-lg bg-white shadow-sm hover:border-black text-left flex flex-col justify-between transition"
              >
                <div>
                  <div className="font-semibold text-sm line-clamp-2">{p.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{p.sku || 'No SKU'}</div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="font-bold text-sm">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    Stok: {p.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Keranjang & Checkout */}
      <div className="p-4 border rounded-lg bg-white shadow-sm flex flex-col h-fit space-y-4">
        <h2 className="text-lg font-bold border-b pb-2">Keranjang Belanja</h2>

        {message && (
          <div
            className={`p-3 text-xs rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">Keranjang masih kosong.</div>
        ) : (
          <div className="space-y-3 divide-y max-h-80 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.itemId} className="pt-2 flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                    className="w-6 h-6 border rounded bg-gray-50 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                    className="w-6 h-6 border rounded bg-gray-50 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between font-bold text-base">
            <span>Total:</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'MANUAL_TRANSFER' | 'QRIS')}
              className="w-full p-2 border rounded text-xs"
            >
              <option value="CASH">CASH (Tunai)</option>
              <option value="QRIS">QRIS</option>
              <option value="MANUAL_TRANSFER">Transfer Bank</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nominal Bayar (Rp)</label>
            <input
              type="number"
              placeholder={`Default: ${totalAmount}`}
              value={amountPaid || ''}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded text-xs"
            />
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 disabled:bg-gray-300 transition"
          >
            {submitting ? 'Proses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </div>

      {/* Render Modal Struk Belanja */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        cart={lastCart}
        totalAmount={lastCart.reduce((s, i) => s + i.price * i.quantity, 0)}
        amountPaid={amountPaid}
        paymentMethod={paymentMethod}
      />
    </div>
  );
}