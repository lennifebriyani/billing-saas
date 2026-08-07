'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AdjustStockParams {
  productId: string
  tenantId: string
  quantityChange: number
  notes?: string
}

export async function adjustStock({ productId, tenantId, quantityChange, notes }: AdjustStockParams) {
  const supabase = await createClient()

  // 1. Verifikasi sesi pengguna
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 2. Verifikasi akses tenant
  const { data: membership, error: memberError } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return { error: 'Access denied to this tenant' }
  }

  // 3. Ambil data produk saat ini
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock, id')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (productError || !product) {
    return { error: 'Product not found' }
  }

  const newStock = product.stock + quantityChange
  if (newStock < 0) {
    return { error: 'Stock cannot be negative' }
  }

  // 4. Catat Stock Movement bertipe ADJUSTMENT
  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      type: 'ADJUSTMENT',
      quantity: quantityChange,
      notes: notes || 'Manual stock adjustment'
    })

  if (movementError) {
    return { error: movementError.message }
  }

  // 5. Perbarui total stok pada tabel produk
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}