'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateProductParams {
  tenantId: string
  name: string
  price: number
  stock: number
  description?: string
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  // 1. Verifikasi sesi pengguna
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const tenantId = formData.get('tenantId') as string
  const name = formData.get('name') as string
  const price = Number(formData.get('price') || 0)
  const stock = Number(formData.get('stock') || 0)
  const description = formData.get('description') as string || null

  if (!tenantId || !name) {
    return { error: 'Tenant ID and Product Name are required' }
  }

  // 2. Verifikasi akses tenant pengguna
  const { data: membership, error: memberError } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return { error: 'Access denied to this tenant' }
  }

  // 3. Masukkan data produk baru ke tabel products
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      name,
      price,
      stock,
      description
    })
    .select()
    .single()

  if (productError || !product) {
    return { error: productError?.message || 'Failed to create product' }
  }

  // 4. Jika stok awal > 0, otomatis buat Stock Movement bertipe INITIAL
  if (stock > 0) {
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        tenant_id: tenantId,
        product_id: product.id,
        type: 'INITIAL',
        quantity: stock,
        notes: 'Initial stock on product creation'
      })

    if (movementError) {
      return { error: movementError.message }
    }
  }

  revalidatePath('/dashboard/products')
  return { success: true, product }
}