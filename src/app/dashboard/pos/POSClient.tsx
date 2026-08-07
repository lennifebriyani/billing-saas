'use client';

import { useState } from 'react';
import { processCheckout } from './actions';
import { useRouter } from 'next/navigation';

// Interfaces berdasarkan skema standar
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface POSClientProps {
  products: Product[];
}

export default function POSClient({ products }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Tambah produk ke keranjang
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit ke batas stok
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Kurangi quantity
  const decreaseQuantity = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  // Hitung total di sisi client HANYA untuk tampilan UI kasir
  const clientSideTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Eksekusi Server Action
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      // HANYA kirim product_id dan quantity. Harga akan dihitung paksa oleh server.
      const payload = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const result = await processCheckout(payload);
      
      if (result.success) {
        alert('Transaksi Berhasil disimpan!');
        setCart([]); // Kosongkan keranjang
        router.refresh(); // Segarkan data produk (sisa stok terbaru)
      }
    } catch (error: any) {
      alert(`Gagal: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* KIRI: Daftar Produk */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Katalog Produk</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`p-4 border rounded-lg text-left transition-all hover:border-blue-500 hover:shadow-md ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white'}`}
            >
              <p className="font-medium text-gray-900 truncate">{p.name}</p>
              <p className="text-sm text-gray-500 mt-1">Stok: {p.stock}</p>
              <p className="font-bold text-blue-600 mt-2">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* KANAN: Keranjang & Checkout */}
      <div className="w-full md:w-96 bg-white border rounded-xl shadow-sm p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Keranjang</h2>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">Belum ada item dipilih.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 truncate">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100 text-lg font-medium shadow-sm">-</button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100 text-lg font-medium shadow-sm">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-gray-600">Total (Estimasi)</span>
            <span className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(clientSideTotal)}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
}