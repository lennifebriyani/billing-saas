'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const supabase = createClient()

  const slugify = (text: string) => {
    const cleanText = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const uniqueId = Math.random().toString(36).substring(2, 6)
    return `${cleanText || 'toko'}-${uniqueId}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!storeName.trim()) return

    setLoading(true)
    setErrorMessage('')

    try {
      // 1. Cek User
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setErrorMessage('Sesi login tidak ditemukan. Silakan login ulang.')
        setLoading(false)
        return
      }

      // 2. Buat slug toko
      const generatedSlug = slugify(storeName)

      // 3. Simpan ke tabel tenants
      const { data: tenant, error: insertError } = await supabase
        .from('tenants')
        .insert([{ name: storeName.trim(), slug: generatedSlug }])
        .select()
        .single()

      if (insertError) throw new Error(`Gagal membuat toko: ${insertError.message}`)

      // 4. Update tabel profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { 
            id: user.id,
            tenant_id: tenant.id, 
            role: 'owner'
          }, 
          { onConflict: 'id' }
        )

      if (profileError) throw new Error(`Gagal menghubungkan profil: ${profileError.message}`)

      // 5. Force reload penuh ke /dashboard (memaksa server membaca session & data baru)
      window.location.href = '/dashboard'

    } catch (error: any) {
      console.error('Onboarding Error:', error)
      setErrorMessage(error.message || 'Terjadi kesalahan sistem.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Setup Toko Baru
        </h1>
        <p className="text-slate-600 mb-6 text-sm">
          Masukkan nama toko atau perusahaan kamu untuk melanjutkan.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm break-words">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="storeName" 
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Nama Toko / Perusahaan
            </label>
            <input
              id="storeName"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Toko Sembako Mak Lambok"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !storeName.trim()}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Memproses & Menyimpan...' : 'Buat Toko & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  )
}