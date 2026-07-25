import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Gunakan Service Role Key agar bisa bypass RLS untuk update database via Webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const notification = await req.json()

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = notification

    // 1. Validasi Signature Key dari Midtrans untuk keamanan
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const mySignatureKey = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex')

    if (mySignatureKey !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 400 })
    }

    // 2. Cek Status Transaksi dari Midtrans
    let subscriptionStatus = 'pending'
    let planType = 'free'

    if (
      transaction_status === 'capture' ||
      transaction_status === 'settlement'
    ) {
      if (fraud_status === 'accept' || !fraud_status) {
        subscriptionStatus = 'active'
        planType = 'pro' // Ubah plan tenant menjadi PRO
      }
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      subscriptionStatus = 'failed'
    }

    // 3. Update status tenant di database Supabase jika pembayaran sukses
    if (planType === 'pro') {
      const parts = order_id.split('-')
      const tenantPrefix = parts[1]

      // Cari tenant berdasarkan ID prefix yang ada di order_id
      const { data: tenants } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .ilike('id', `${tenantPrefix}%`)

      if (tenants && tenants.length > 0) {
        const targetTenantId = tenants[0].id

        await supabaseAdmin
          .from('tenants')
          .update({
            plan_type: 'pro',
            subscription_status: subscriptionStatus,
          })
          .eq('id', targetTenantId)
      }
    }

    return NextResponse.json({ status: 'OK' })
  } catch (error: any) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}