'use client'

import { useState, useEffect, useTransition } from 'react'
import { getTenantSettings, updateTenantSettings, TenantSettings } from './actions'

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      const data = await getTenantSettings()
      setSettings(data)
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateTenantSettings(formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Pengaturan toko berhasil diperbarui!' })
      }
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat pengaturan toko...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengaturan Toko & Branding</h1>
        <p className="text-sm text-gray-500">Kelola identitas bisnis dan penyesuaian cetak struk tenant Anda.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">Informasi Umum</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko / Bisnis *</label>
            <input
              type="text"
              name="name"
              defaultValue={settings?.name || ''}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon / WhatsApp</label>
            <input
              type="text"
              name="phone"
              defaultValue={settings?.phone || ''}
              placeholder="08123456789"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Toko</label>
            <textarea
              name="address"
              rows={3}
              defaultValue={settings?.address || ''}
              placeholder="Jl. Contoh No. 123, Kota..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2">Kustomisasi Struk Pembayaran</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Header Struk</label>
            <input
              type="text"
              name="receipt_header"
              defaultValue={settings?.receipt_header || ''}
              placeholder="Selamat Datang di Toko Kami!"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Footer Struk</label>
            <input
              type="text"
              name="receipt_footer"
              defaultValue={settings?.receipt_footer || ''}
              placeholder="Terima kasih atas kunjungan Anda!"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}