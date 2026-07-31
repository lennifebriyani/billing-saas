'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { MIDTRANS_SNAP_URL, MIDTRANS_SERVER_KEY } from '@/lib/midtrans'

export interface CartItem {
  itemId: string
  productId: string
  name: string
  price: number
  quantity: number
}

// 1. Fetch Produk Aktif untuk Katalog POS
export async function getActiveProducts() {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return []

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock, sku')
    .eq('tenant_id', tenant.id)
    .gt('stock', 0)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching active products:', error.message)
    return []
  }

  return data || []
}

// 2. Transaksi Checkout POS (Manual / Cash)
export async function createOrder(items: CartItem[], paymentMethod: string = 'cash') {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant context tidak ditemukan.' }
  }

  if (!items || items.length === 0) {
    return { error: 'Keranjang belanja kosong.' }
  }

  // Hitung Total Server-Side
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Insert ke tabel orders
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant.id,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      status: paymentMethod === 'cash' ? 'PAID' : 'PENDING',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Error creating order:', orderError?.message)
    return { error: 'Gagal membuat pesanan.' }
  }

  // Insert order items & potong stok
  for (const item of items) {
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        tenant_id: tenant.id,
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      })

    if (itemError) {
      console.error('Error creating order item:', itemError.message)
    }

    // Potong stok produk
    const { data: prod } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .eq('tenant_id', tenant.id)
      .single()

    if (prod) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, prod.stock - item.quantity) })
        .eq('id', item.productId)
        .eq('tenant_id', tenant.id)
    }
  }

  return { success: true, orderId: order.id }
}

// 3. Buat Snap Token Midtrans untuk Payment Gateway
export async function createMidtransSnapToken(orderId: string) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant context tidak ditemukan.' }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      order_items (
        quantity,
        unit_price,
        product_id,
        products (
          name
        )
      )
    `)
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (orderError || !order) {
    return { error: 'Order tidak ditemukan atau tidak valid.' }
  }

  if (!MIDTRANS_SERVER_KEY) {
    return { error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi di server.' }
  }

  const itemDetails = order.order_items.map((item: any) => {
    const productName = Array.isArray(item.products)
      ? item.products[0]?.name
      : item.products?.name

    return {
      id: item.product_id,
      price: item.unit_price,
      quantity: item.quantity,
      name: (productName || 'Produk').substring(0, 50),
    }
  })

  const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')

  const payload = {
    transaction_details: {
      order_id: order.id,
      gross_amount: order.total_amount,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: tenant.name,
      notes: `Order via ${tenant.name}`,
    },
  }

  try {
    const response = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Midtrans Snap API Error:', data)
      return { error: data.error_messages?.join(', ') || 'Gagal membuat sesi pembayaran.' }
    }

    return {
      token: data.token,
      redirectUrl: data.redirect_url,
    }
  } catch (err: any) {
    console.error('Fetch Midtrans Error:', err)
    return { error: 'Gagal terhubung ke gateway pembayaran Midtrans.' }
  }
}