'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { MIDTRANS_SNAP_URL, MIDTRANS_SERVER_KEY } from '@/lib/midtrans'

export async function createSubscriptionSnapToken(planType: 'core' | 'plus') {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { error: 'Tenant context tidak ditemukan.' }
  }

  const amount = planType === 'core' ? 249000 : 499000
  const planName = planType === 'core' ? 'SaaS Billing - Paket Core (1 Bulan)' : 'SaaS Billing - Paket Plus (1 Bulan)'
  const orderId = `SUB-${tenant.id.substring(0, 8)}-${Date.now()}`

  if (!MIDTRANS_SERVER_KEY) {
    return { error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi.' }
  }

  const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: [
      {
        id: `plan-${planType}`,
        price: amount,
        quantity: 1,
        name: planName,
      },
    ],
    customer_details: {
      first_name: tenant.name,
      notes: `Subscription Plan ${planType.toUpperCase()}`,
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
      return { error: data.error_messages?.join(', ') || 'Gagal membuat tagihan subscription.' }
    }

    // Catat record pending subscription invoice
    await supabase.from('subscription_invoices').insert({
      tenant_id: tenant.id,
      order_id: orderId,
      plan_type: planType,
      amount: amount,
      status: 'PENDING',
    })

    return {
      token: data.token,
      redirectUrl: data.redirect_url,
    }
  } catch (err: any) {
    console.error('Subscription Snap Error:', err)
    return { error: 'Gagal terhubung ke gateway pembayaran.' }
  }
}