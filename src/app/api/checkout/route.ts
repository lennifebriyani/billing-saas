import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://usoyrvhgydcdnzhyahvp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, userEmail, planName, amount } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json({ message: 'User ID and Amount are required' }, { status: 400 });
    }

    // 1. Buat Order ID Unik (contoh: ORDER-1722250000-XYZ)
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 2. Simpan record awal di tabel 'subscriptions' Supabase dengan status PENDING
    const { error: dbError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      order_id: orderId,
      status: 'PENDING',
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ message: 'Failed to create subscription record' }, { status: 500 });
    }

    // 3. Panggil API Midtrans Snap untuk mendapatkan Snap Token & Redirect URL
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    // Menggunakan endpoint Production Midtrans Snap
    const midtransResponse = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          email: userEmail,
        },
        item_details: [
          {
            id: planName || 'PRO_PLAN',
            price: amount,
            quantity: 1,
            name: `Subscription Plan: ${planName || 'Pro'}`,
          },
        ],
      }),
    });

    const snapData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error('Midtrans Error:', snapData);
      return NextResponse.json({ message: 'Midtrans transaction creation failed' }, { status: 500 });
    }

    // 4. Kirim token & redirect_url ke Frontend
    return NextResponse.json({
      token: snapData.token,
      redirect_url: snapData.redirect_url,
      order_id: orderId,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}