'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

// 1. Fetch Produk berdasarkan Tenant Aktif
export async function getProducts() {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return []

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error.message)
    return []
  }

  return data
}

// 2. Tambah Produk Baru (Untuk panggilan kustom/Client Component)
export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant tidak ditemukan atau session telah berakhir.' }
  }

  const name = formData.get('name') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string, 10) || 0
  const sku = (formData.get('sku') as string) || null

  if (!name || price <= 0) {
    return { error: 'Nama produk dan harga valid wajib diisi.' }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: tenant.id,
      name,
      price,
      stock,
      sku,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pos')
  return { success: true, data }
}

// 3. Server Action khusus untuk <form action={createCatalogItem}>
// Return type diset eksplisit ke Promise<void> untuk memenuhi standar JSX Form
export async function createCatalogItem(formData: FormData): Promise<void> {
  await createProduct(formData)
}

// 4. Hapus Produk
export async function deleteCatalogItem(id: string) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant tidak ditemukan.' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pos')
  return { success: true }
}