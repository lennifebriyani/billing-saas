'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CartItemInput {
  product_id: string;
  quantity: number;
}

export async function processCheckout(cartItems: CartItemInput[]) {
  const supabase = await createClient();

  // 1. Verifikasi Sesi
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda belum login.');

  // 2. Dapatkan Konteks Tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Sesi usaha tidak valid.');

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Keranjang belanja kosong.');
  }

  // 3. Panggil RPC Supabase untuk Transaksi Atomik
  const { data: transactionId, error } = await supabase.rpc('checkout_pos', {
    p_tenant_id: tenantUser.tenant_id,
    p_user_id: user.id,
    p_cart_items: cartItems,
  });

  if (error) {
    console.error('[POS Checkout Error]:', error.message);
    throw new Error(error.message || 'Gagal memproses transaksi.');
  }

  // 4. Revalidate seluruh rute yang bergantung pada transaksi dan stok
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/products');

  return { success: true, transactionId };
}