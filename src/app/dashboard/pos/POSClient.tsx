"use client";

import { useState } from "react";
import { CartItem, createPOSTransaction } from "./actions";

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export default function POSClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "manual_transfer">("cash");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tambah Produk ke Keranjang (menggunakan `id`, bukan `productId`)
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
        },
      ];
    });
  };

  // Ubah Jumlah Item
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
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
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const numericCash = parseFloat(cashAmount) || 0;
  const changeAmount = numericCash - totalAmount;

  // Selesaikan Transaksi
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && numericCash < totalAmount) {
      alert("Jumlah uang tunai kurang dari total pembayaran.");
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);

    try {
      // Panggil createPOSTransaction hanya dengan cart
      await createPOSTransaction(cart);
      setSuccessMessage("Transaksi Berhasil Disimpan!");
      setCart([]);
      setCashAmount("");
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Katalog Produk (2 Kolom) */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Pilih Produk</h2>

        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            <p className="text-sm font-medium">Belum ada produk aktif yang tersedia.</p>
            <p className="text-xs mt-1">Silakan tambahkan produk terlebih dahulu di menu Kelola Produk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-sm text-left transition flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs font-bold text-blue-600 mt-2">
                    Rp {Number(product.price).toLocaleString("id-ID")}
                  </p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded mt-3 w-fit">
                  + Tambah
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Rincian Keranjang & Pembayaran */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold">
              ✅ {successMessage}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-1">🛒</div>
              <p className="text-xs">Keranjang masih kosong.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs border-b border-gray-100 pb-2"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-gray-500">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-gray-900 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total & Pilihan Pembayaran */}
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Total Tagihan:</span>
            <span className="text-xl font-extrabold text-gray-900">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {cart.length > 0 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      paymentMethod === "cash"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    💵 Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("manual_transfer")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      paymentMethod === "manual_transfer"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🏦 Transfer Manual
                  </button>
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Masukkan jumlah uang"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {numericCash > 0 && (
                    <p
                      className={`text-xs font-semibold mt-1 ${
                        changeAmount >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {changeAmount >= 0
                        ? `Kembalian: Rp ${changeAmount.toLocaleString("id-ID")}`
                        : `Kurang: Rp ${Math.abs(changeAmount).toLocaleString("id-ID")}`}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
              >
                {isLoading ? "Memproses..." : "Selesaikan & Bayar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}