'use server';

import { createClient } from '@/lib/supabase/server';

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Mengambil produk aktif dari tabel catalog_items (yang stoknya > 0)
 */
export async function getActiveProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .gt('stock', 0)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching catalog items:', error);
    return [];
  }

  return data || [];
}

/**
 * Menjalankan transaksi POS secara atomik lewat Stored Procedure
 */
export async function createOrder(
  items: CartItem[],
  paymentMethod: 'CASH' | 'MANUAL_TRANSFER' | 'QRIS' = 'CASH',
  amountPaid: number,
  customerId?: string
) {
  const supabase = await createClient();

  if (!items || items.length === 0) {
    return { error: 'Keranjang belanja tidak boleh kosong.' };
  }

  const formattedItems = items.map((item) => ({
    item_id: item.itemId,
    quantity: item.quantity,
  }));

  // Memanggil Stored Procedure Atomic di Supabase
  const { data, error } = await supabase.rpc('create_transaction_atomic', {
    p_customer_id: customerId || null,
    p_items: formattedItems,
    p_payment_method: paymentMethod,
    p_amount_paid: amountPaid,
  });

  if (error) {
    console.error('POS Checkout Error:', error.message);
    return { error: error.message };
  }

  return { success: true, data };
}

// Alias untuk kompatibilitas
export const createPOSTransaction = createOrder;