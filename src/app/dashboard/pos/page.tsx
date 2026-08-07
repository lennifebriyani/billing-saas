'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { processCheckout } from './actions'; // Memanggil fungsi checkout atomik yang sudah kita buat

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface POSClientProps {
  products: Product[];
}

export default function POSClient({ products }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const router = useRouter();

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok ${product.name} tidak mencukupi (sisa ${product.stock})`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > maxStock) {
              alert(`Stok maksimal hanya ${maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Kalkulasi murni untuk tampilan visual kasir. Uang asli dihitung di server.
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      // Sesuai Section 11: Hanya kirim item ID dan Quantity ke server.
      const payload = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }));

      const res = await processCheckout(payload);
      
      if (res.success) {
        alert('Transaksi berhasil! Invoice telah otomatis diterbitkan.');
        setCart([]);
        // Refresh router agar Next.js mengambil data sisa stok terbaru dari Server
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal memproses transaksi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kolom Katalog Produk */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => product.stock > 0 && addToCart(product)}
              className={`p-4 border rounded-lg bg-white shadow-sm flex flex-col justify-between transition ${
                product.stock > 0 ? 'hover:border-blue-500 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-50'
              }`}
            >
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-xs text-gray-500">Stok: {product.stock}</p>
              </div>
              <p className="mt-3 text-sm font-bold text-blue-600">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">
              Belum ada produk aktif yang tersedia.
            </p>
          )}
        </div>
      </div>

      {/* Kolom Keranjang & Checkout */}
      <div className="border rounded-lg bg-white p-4 shadow-sm flex flex-col justify-between h-[calc(100vh-140px)]">
        <div>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Keranjang Belanja</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Keranjang kosong</p>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => {
                const catalogProd = products.find((p) => p.id === item.productId);
                const maxStock = catalogProd ? catalogProd.stock : 999;

                return (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center text-sm border-b pb-2"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1, maxStock)}
                        className="w-6 h-6 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1, maxStock)}
                        className="w-6 h-6 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 text-xs ml-2 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Pembayaran */}
        <div className="border-t pt-4 space-y-4 mt-4">
          <div className="flex justify-between items-center text-base font-bold">
            <span>Total:</span>
            <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 text-xs font-semibold rounded border ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Fitur QRIS sedang dalam tahap validasi Phase 4. Gunakan Tunai sementara ini.');
                }}
                className={`py-2 text-xs font-semibold rounded border ${
                  paymentMethod === 'qris'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                QRIS / Midtrans
              </button>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Memproses...' : 'Selesaikan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}