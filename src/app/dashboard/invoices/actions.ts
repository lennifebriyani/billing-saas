'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export interface InvoiceFilter {
  status?: string
  limit?: number
}

// 1. Fetch Daftar Invoices/Orders Berdasarkan Tenant
export async function getInvoices(filters?: InvoiceFilter) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return []

  let query = supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_method,
      status,
      created_at,
      order_items (
        id
      )
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching invoices:', error.message)
    return []
  }

  return data || []
}

// 2. Fetch Detail Invoice Tunggal Beserta Relasi Item & Produk
export async function getInvoiceDetails(orderId: string) {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant || !orderId) return null

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_method,
      status,
      created_at,
      order_items (
        id,
        quantity,
        unit_price,
        subtotal,
        product_id,
        products (
          name,
          sku
        )
      )
    `)
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (error) {
    console.error('Error fetching invoice details:', error.message)
    return null
  }

  return data
}

// Alias untuk kompatibilitas pencarian order
export async function getOrders(filters?: InvoiceFilter) {
  return getInvoices(filters)
}

export async function getOrderById(orderId: string) {
  return getInvoiceDetails(orderId)
}