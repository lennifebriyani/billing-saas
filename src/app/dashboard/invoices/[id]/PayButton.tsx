'use client'

import { useState } from 'react'

interface PayButtonProps {
  invoiceId: string
  status: string
}

export default function PayButton({ invoiceId, status }: PayButtonProps) {
  const [loading, setLoading] = useState(false)

  if (status === 'paid') {
    return (
      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200">
        ✓ Pembayaran Selesai
      </span>
    )
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pembayaran')

      // Redirect ke Halaman Pembayaran Midtrans (QRIS / VA / Bank)
      if (data.redirect_url) {
        window.location.href = data.redirect_url
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:bg-slate-300"
    >
      {loading ? 'Memuat Link Bayar...' : '💳 Bayar Sekarang (Online)'}
    </button>
  )
}