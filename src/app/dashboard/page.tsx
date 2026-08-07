'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Gunakan client-side Supabase untuk komponen yang memiliki 'use client'
import { createClient } from '@/lib/supabase/client'; 

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUserEmail(session.user.email || 'Pengguna');
        setLoading(false);
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Memuat Dashboard Lumina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Lumina Billing & POS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Halo, <b>{userEmail}</b></span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Total Penjualan Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">Rp 0</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Produk Terdaftar</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">0 Item</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Status Tenant</p>
            <p className="text-lg font-bold text-green-600 mt-2">Aktif (Ready)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Selamat Datang di Lumina SaaS!</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Sistem inventaris, POS, dan billing Anda sudah siap digunakan. Silakan mulai kelola produk dan transaksi toko Anda.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => router.push('/pos')}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Buka Kasir (POS)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}