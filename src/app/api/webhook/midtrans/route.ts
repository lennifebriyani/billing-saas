import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json({ error: 'Server Key not configured' }, { status: 500 });
    }

    // 1. Verifikasi Signature Key Midtrans
    const hash = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
      .digest('hex');

    if (hash !== body.signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const transactionStatus = body.transaction_status;
    const orderId = body.order_id;

    let paymentStatus = 'PENDING';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      paymentStatus = 'PAID';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      paymentStatus = 'FAILED';
    }

    const supabase = await createClient();

    // 2. Update Status Transaksi di Database Canonical
    const { error } = await supabase
      .from('transactions')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Webhook Update Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: paymentStatus });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}