'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id, tenants(name)')
          .eq('id', user.id)
          .single()

        if (profile) {
          setTenantId(profile.tenant_id)
          const tenant = profile.tenants as unknown as { name: string } | null
          setStoreName(tenant?.name || '')
        }
      }
      setLoading(false)
    }

    loadSettings()
  }, [])

  // Update Nama Toko
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName.trim() || !tenantId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('tenants')
      .update({ name: storeName.trim() })
      .eq('id', tenantId)

    if (error) {
      setMessage('⚠️ Gagal memperbarui nama toko.')
    } else {
      setMessage('✅ Nama toko berhasil diperbarui!')
      setTimeout(() => window.location.reload(), 1000)
    }
    setSaving(false)
  }

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="p-8 text-slate-500 text-sm">Memuat pengaturan...</div>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Toko</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Kelola profil toko dan sesi akun kamu.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-slate-100 rounded-lg text-sm font-medium text-slate-800">
          {message}
        </div>
      )}

      {/* Form Profil Toko */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Informasi Toko
        </h3>

        <form onSubmit={handleUpdateStore} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Toko / Perusahaan
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Pemilik Akun
            </label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !storeName.trim()}
            className="px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Sesi & Logout */}
      <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm space-y-3">
        <h3 className="font-bold text-red-600 text-base">Keluar Sesi</h3>
        <p className="text-xs text-slate-500">
          Keluar dari akun aplikasi Billing SaaS ini.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout Dari Akun
        </button>
      </div>
    </div>
  )
}