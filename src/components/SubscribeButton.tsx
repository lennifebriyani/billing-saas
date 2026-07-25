'use client'

import { useState, useEffect } from 'react'

// Deklarasi tipe TypeScript untuk window.snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void
          onPending?: (result: any) => void
          onError?: (result: any) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

interface SubscribeButtonProps {
  tenantId: string
  tenantName: string
  email: string
}

export default function SubscribeButton({ tenantId, tenantName, email }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)

  // Memuat Script Snap Midtrans secara dinamis berdasarkan Environment
  useEffect(() => {
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const snapScriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''

    // Cek jika script belum terpasang di DOM
    const existingScript = document.querySelector(`script[src*="midtrans.com/snap/snap.js"]`)
    
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = snapScriptUrl
      script.setAttribute('data-client-key', clientKey)
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, tenantName, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(`Error API (${res.status}): ${data.error || 'Gagal memproses checkout'}`)
        return
      }

      if (data.token) {
        if (typeof window.snap !== 'undefined' && window.snap.pay) {
          window.snap.pay(data.token, {
            onSuccess: function (result) {
              console.log('Payment success:', result)
              alert('Pembayaran Berhasil!')
              window.location.reload()
            },
            onPending: function (result) {
              console.log('Payment pending:', result)
              alert('Menunggu Pembayaran...')
            },
            onError: function (result) {
              console.error('Payment error:', result)
              alert('Pembayaran Gagal!')
            },
            onClose: function () {
              alert('Pop-up pembayaran ditutup.')
            },
          })
        } else {
          alert('SDK Midtrans belum siap. Coba refresh halaman (F5).')
        }
      } else {
        alert('Token pembayaran tidak ditemukan: ' + (data.error || 'Kosong'))
      }
    } catch (err: any) {
      alert('Terjadi kesalahan koneksi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Memproses...' : 'Aktifkan Langganan (Rp 200.000 / Bulan)'}
    </button>
  )
}