import { NextResponse } from 'next/server'
import { snap } from '@/lib/midtrans'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, tenantName, email } = body

    // Buat kode transaksi unik
    const orderId = `SUBS-${tenantId.slice(0, 5)}-${Date.now()}`

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: 200000, // Nominal langganan Rp 200.000
      },
      customer_details: {
        first_name: tenantName,
        email: email,
      },
      item_details: [
        {
          id: 'PLAN-MONTHLY-200K',
          price: 200000,
          quantity: 1,
          name: 'Langganan SaaS Billing (1 Bulan)',
        },
      ],
    }

    // Minta token transaksi dari Midtrans Snap
    const transaction = await snap.createTransaction(parameter)

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    })
  } catch (error: any) {
    console.error('Midtrans Error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memproses transaksi' },
      { status: 500 }
    )
  }
}