'use client';

import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // 1. Panggil API Checkout yang baru saja kita buat
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'USER_ID_DARI_SUPABASE_AUTH', // Ganti dengan user.id dari Supabase Auth
          userEmail: 'user@example.com',        // Ganti dengan email user
          planName: 'Pro Monthly Plan',
          amount: 100000,                       // Nominal pembayaran (Rp 100.000)
        }),
      });

      const data = await response.json();

      if (data.redirect_url) {
        // 2. Arahkan user ke halaman checkout Midtrans Snap
        window.location.href = data.redirect_url;
      } else {
        alert('Gagal membuat transaksi: ' + (data.message || 'Error'));
      }
    } catch (error) {
      console.error('Error checkout:', error);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Pilih Paket Langganan</h1>
      <div className="border p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold">Pro Plan</h2>
        <p className="text-gray-600 my-2">Rp 100.000 / bulan</p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Langganan Sekarang'}
        </button>
      </div>
    </div>
  );
}