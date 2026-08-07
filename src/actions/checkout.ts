'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CartItem {
  productId: string
  quantity: number
}

interface CheckoutParams {
  tenantId: string
  cartItems: CartItem[]
}

export async function processCheckout({ tenantId, cartItems }: CheckoutParams) {
  const supabase = await createClient()

  // 1. Verifikasi sesi pengguna
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
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

  // Buat referensi ID untuk transaksi order ini
  const orderId = crypto.randomUUID()

  // 3. Loop item cart untuk memperbarui stok dan mencatat movement
  for (const item of cartItems) {
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .eq('tenant_id', tenantId)
      .single()

    if (prodError || !product) {
      return { error: `Product not found: ${item.productId}` }
    }

    const newStock = product.stock - item.quantity
    if (newStock < 0) {
      return { error: `Insufficient stock for product ID: ${item.productId}` }
    }

    // Update stok di tabel products
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.productId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Catat stock movement bertipe SALE
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        tenant_id: tenantId,
        product_id: item.productId,
        type: 'SALE',
        quantity: -Math.abs(item.quantity),
        reference_id: orderId,
        notes: `Checkout sale for order ${orderId}`
      })

    if (movementError) {
      return { error: movementError.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true, orderId }
}