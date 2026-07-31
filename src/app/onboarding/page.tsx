'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Panggil 1 RPC ini, PostgreSQL yang akan urus Buat Toko + Owner + Update Profile
      const { data: tenantId, error: rpcError } = await supabase.rpc('create_tenant_onboarding', {
        tenant_name: name,
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      // Berhasil! Langsung tembus ke dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Onboarding Error:', err)
      setError(err.message || 'Terjadi kesalahan saat membuat toko.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Setup Toko Baru</h1>
          <p className="text-sm text-gray-600">
            Masukkan nama toko atau perusahaan kamu untuk melanjutkan.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Nama Toko / Perusahaan
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PS 5 LAMBOK"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? 'Memproses...' : 'Buat Toko & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  )
}