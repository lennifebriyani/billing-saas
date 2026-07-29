import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client dengan URL proyek kamu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://usoyrvhgydcdnzhyahvp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // 1. Verifikasi Signature Key dari Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hash = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (hash !== signature_key) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // 2. Update Status Langganan di Database Supabase
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'ACTIVE',
            updated_at: new Date().toISOString() 
          })
          .eq('order_id', order_id);

        if (error) console.error('Error updating Supabase:', error);
        console.log(`[PAYMENT SUCCESS] Order ID: ${order_id}`);
      }
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'EXPIRED',
          updated_at: new Date().toISOString() 
        })
        .eq('order_id', order_id);

      if (error) console.error('Error updating Supabase:', error);
      console.log(`[PAYMENT FAILED/EXPIRED] Order ID: ${order_id}`);
    } else if (transaction_status === 'pending') {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'PENDING',
          updated_at: new Date().toISOString() 
        })
        .eq('order_id', order_id);

      if (error) console.error('Error updating Supabase:', error);
      console.log(`[PAYMENT PENDING] Order ID: ${order_id}`);
    }

    // 3. Respon 200 OK ke Midtrans
    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}