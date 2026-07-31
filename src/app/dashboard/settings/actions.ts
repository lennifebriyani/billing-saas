'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export interface TenantSettings {
  id: string
  name: string
  slug: string
  address?: string | null
  phone?: string | null
  receipt_header?: string | null
  receipt_footer?: string | null
}

// 1. Fetch Data Profil Tenant Saat Ini
export async function getTenantSettings(): Promise<TenantSettings | null> {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return null

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, address, phone, receipt_header, receipt_footer')
    .eq('id', tenant.id)
    .single()

  if (error) {
    console.error('Error fetching tenant settings:', error.message)
    return null
  }

  return data
}

// 2. Update Data Profil & Branding Tenant
export async function updateTenantSettings(formData: FormData) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant tidak ditemukan or session expired.' }
  }

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const receipt_header = formData.get('receipt_header') as string
  const receipt_footer = formData.get('receipt_footer') as string

  if (!name) {
    return { error: 'Nama toko/bisnis wajib diisi.' }
  }

  const { error } = await supabase
    .from('tenants')
    .update({
      name,
      address,
      phone,
      receipt_header,
      receipt_footer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id)

  if (error) {
    console.error('Error updating tenant settings:', error.message)
    return { error: 'Gagal memperbarui pengaturan toko.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}