import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json()
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID dibutuhkan' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Ambil data Invoice & Customer
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, customers(name, email, phone)')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      return NextResponse.json({ error: 'Server Key Midtrans belum dikonfigurasi' }, { status: 500 })
    }

    // 2. Format Request Payload Midtrans Snap
    const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`
    const payload = {
      transaction_details: {
        order_id: invoice.invoice_number,
        gross_amount: Math.round(Number(invoice.amount))
      },
      customer_details: {
        first_name: invoice.customers?.name || 'Pelanggan',
        email: invoice.customers?.email || 'customer@example.com',
        phone: invoice.customers?.phone || ''
      },
      item_details: [
        {
          id: invoice.id,
          price: Math.round(Number(invoice.amount)),
          quantity: 1,
          name: `Pembayaran ${invoice.invoice_number}`
        }
      ]
    }

    // 3. Request Snap Token / Redirect URL ke Midtrans API
    const isProduction = process.env.NODE_ENV === 'production'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    const midtransRes = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify(payload)
    })

    const midtransData = await midtransRes.json()

    if (!midtransRes.ok) {
      throw new Error(midtransData.error_messages?.[0] || 'Gagal membuat transaksi di Midtrans')
    }

    return NextResponse.json({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}