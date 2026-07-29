'use client';

import { useState, useEffect } from 'react';
import { getActiveProducts, createOrder, CartItem } from './actions';

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Fetch produk aktif
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getActiveProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar produk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter Produk berdasarkan pencarian
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Tambah Produk ke Keranjang
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        { id: product.id, name: product.name, price: product.price, quantity: 1 },
      ];
    });
  };

  // Ubah Jumlah Item (+ / -)
  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Hapus Item dari Keranjang
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Hitung Total Belanja
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Selesaikan Transaksi
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await createOrder(cart);
      setCart([]);
      setSuccessModal(true);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kasir (POS)</h1>
        <p className="text-sm text-gray-500">Pilih produk dan selesaikan transaksi dengan cepat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SISI KIRI: Katalog Produk */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
          />

          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white border rounded-xl">
              Memuat menu...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white border rounded-xl">
              Produk tidak ditemukan atau belum ada produk aktif.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition text-left flex flex-col justify-between group h-28"
                >
                  <span className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-indigo-600">
                    {p.name}
                  </span>
                  <span className="font-bold text-indigo-600 text-sm">
                    Rp {Number(p.price).toLocaleString('id-ID')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SISI KANAN: Ringkasan Keranjang */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4 sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
            Ringkasan Pesanan
          </h2>

          <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Keranjang belanja masih kosong.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center text-base font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-indigo-600">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 text-sm"
            >
              {submitting ? 'Memproses Transaksi...' : 'Selesaikan Pembayaran'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Sukses Transaksi */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900">Transaksi Berhasil!</h3>
            <p className="text-sm text-gray-500">
              Data transaksi telah tersimpan ke database tenant Anda.
            </p>
            <button
              onClick={() => setSuccessModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
            >
              Tutup & Lanjut Kasir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}