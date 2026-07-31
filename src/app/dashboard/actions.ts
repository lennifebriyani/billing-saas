'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  lowStockCount: number
}

export interface RecentOrder {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
}

// 1. Fetch Ringkasan Statistik Utama
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      lowStockCount: 0,
    }
  }

  // Fetch Pesanan untuk Total Revenue & Total Orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('tenant_id', tenant.id)

  const totalOrders = orders ? orders.length : 0
  const totalRevenue = orders ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0

  if (ordersError) {
    console.error('Error fetching order stats:', ordersError.message)
  }

  // Fetch Produk untuk Total Products & Stok Tipis (<= 5)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, stock')
    .eq('tenant_id', tenant.id)

  const totalProducts = products ? products.length : 0
  const lowStockCount = products ? products.filter((p) => p.stock <= 5).length : 0

  if (productsError) {
    console.error('Error fetching product stats:', productsError.message)
  }

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
  }
}

// 2. Fetch 5 Transaksi Terakhir
export async function getRecentOrders(): Promise<RecentOrder[]> {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return []

  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount, payment_method, status, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching recent orders:', error.message)
    return []
  }

  return data || []
}