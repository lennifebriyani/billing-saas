'use client'

import { useState } from 'react'
import { createSubscriptionSnapToken } from './actions'

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<'core' | 'plus' | null>(null)

  const handleUpgrade = async (plan: 'core' | 'plus') => {
    setLoadingPlan(plan)
    try {
      const res = await createSubscriptionSnapToken(plan)
      if (res.error) {
        alert(`Error: ${res.error}`)
      } else if (res.redirectUrl) {
        window.open(res.redirectUrl, '_blank')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses langganan.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Langganan & Billing Platform</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih paket yang sesuai dengan kebutuhan operasional usahamu.
        </p>
      </div>

      {/* Banner Status Trial */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Status Saat Ini: Trial Gratis (30 Hari)</h3>
          <p className="text-xs text-blue-700 mt-0.5">
            Semua fitur Core terbuka penuh selama masa uji coba. Upgrade kapan saja untuk menjaga akses tanpa terputus.
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
          TRIAL
        </span>
      </div>

      {/* Grid Paket Langganan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paket Core */}
        <div className="border rounded-xl bg-white p-6 shadow-sm flex flex-col justify-between hover:border-blue-500 transition">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Paket Core</h2>
                <p className="text-xs text-gray-500 mt-1">Cocok untuk usaha single-outlet aktif</p>
              </div>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                Populer
              </span>
            </div>

            <div className="my-6">
              <span className="text-3xl font-extrabold text-gray-900">Rp 249.000</span>
              <span className="text-sm text-gray-500"> / bulan</span>
            </div>

            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center">✓ 1 Outlet Usaha</li>
              <li className="flex items-center">✓ Hingga 5 Akun Pengguna / Staf</li>
              <li className="flex items-center">✓ Mesin Kasir POS & Cetak Struk</li>
              <li className="flex items-center">✓ Manajemen Produk & Stok Tipis</li>
              <li className="flex items-center">✓ Pembayaran Tunai & QRIS</li>
              <li className="flex items-center">✓ Laporan Penjualan Harian</li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('core')}
            disabled={loadingPlan !== null}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loadingPlan === 'core' ? 'Memproses...' : 'Pilih Paket Core'}
          </button>
        </div>

        {/* Paket Plus */}
        <div className="border-2 border-blue-600 rounded-xl bg-white p-6 shadow-sm flex flex-col justify-between relative">
          <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
            Rekomendasi
          </div>

          <div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Paket Plus</h2>
              <p className="text-xs text-gray-500 mt-1">Untuk usaha dengan tim & cabang yang membutuhkan kontrol ketat</p>
            </div>

            <div className="my-6">
              <span className="text-3xl font-extrabold text-gray-900">Rp 499.000</span>
              <span className="text-sm text-gray-500"> / bulan</span>
            </div>

            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center">✓ Semuanya di Paket Core</li>
              <li className="flex items-center">✓ Hingga 3 Outlet Usaha</li>
              <li className="flex items-center">✓ Hingga 20 Akun Pengguna</li>
              <li className="flex items-center">✓ Granular Role & Permission Staf</li>
              <li className="flex items-center">✓ Laporan Analitik Lanjutan & Profit Margin</li>
              <li className="flex items-center">✓ Priority Support Line</li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('plus')}
            disabled={loadingPlan !== null}
            className="w-full py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loadingPlan === 'plus' ? 'Memproses...' : 'Upgrade ke Paket Plus'}
          </button>
        </div>
      </div>
    </div>
  )
}