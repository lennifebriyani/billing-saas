'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createTenant(formData: FormData) {
  const supabase = await createClient()

  // 1. Verifikasi User yang sedang login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const rawSlug = formData.get('slug') as string
  
  // Format slug otomatis jika tidak diisi manual
  const slug = (rawSlug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  if (!name) {
    return redirect('/onboarding?error=Nama%20bisnis/toko%20harus%20diisi')
  }

  // 2. Insert record Tenant baru ke database
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
    })
    .select()
    .single()

  if (tenantError) {
    return redirect(`/onboarding?error=${encodeURIComponent(tenantError.message)}`)
  }

  // 3. Hubungkan User dengan Tenant baru sebagai 'owner'
  const { error: memberError } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    return redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`)
  }

  // 4. Refresh layout cache dan alihkan user ke Dashboard Utama
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}