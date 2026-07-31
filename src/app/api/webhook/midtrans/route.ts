import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyMidtransSignature } from '@/lib/midtrans'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body

    // 1. Verifikasi Keaslian Webhook Signature SHA-512
    const isValidSignature = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    )

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 })
    }

    const supabase = await createClient()

    // 2. Ambil Status Order Saat Ini (Idempotency Check)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, tenant_id')
      .eq('id', order_id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Jika order sudah dibayar/selesai, abaikan request duplikat (Idempotent)
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Order already processed' }, { status: 200 })
    }

    // 3. Tentukan Status Transaksi Baru
    let newStatus = order.status

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'PENDING'
      } else if (fraud_status === 'accept') {
        newStatus = 'PAID'
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'PAID'
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      newStatus = 'CANCELLED'
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING'
    }

    // 4. Update Database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_method: payment_type || 'qris/gateway',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('Error updating order webhook status:', updateError.message)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ status: 'success', newStatus }, { status: 200 })
  } catch (err: any) {
    console.error('Webhook Handler Error:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}