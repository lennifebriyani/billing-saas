"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export async function getActiveProducts() {
  const supabase = await createClient();
  const tenant = await getCurrentTenant();

  if (!tenant) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil produk kasir:", error);
    return [];
  }

  return data;
}

export async function createOrder(cartItems: CartItem[]) {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Keranjang belanja masih kosong.");
  }

  const supabase = await createClient();
  const tenant = await getCurrentTenant();

  if (!tenant) {
    throw new Error("Tenant tidak ditemukan atau sesi login telah berakhir.");
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 1. Simpan Header Transaksi
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      total_amount: totalAmount,
      status: "completed",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Gagal membuat order:", orderError);
    throw new Error("Gagal memproses transaksi.");
  }

  // 2. Simpan Detail Item Transaksi
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Gagal membuat order items:", itemsError);
    throw new Error("Gagal menyimpan detail item transaksi.");
  }

  // 3. Potong Stok Produk Otomatis
  for (const item of cartItems) {
    const { data: currentProd } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();

    if (currentProd && typeof currentProd.stock === "number") {
      const newStock = Math.max(0, currentProd.stock - item.quantity);
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.id);
    }
  }

  revalidatePath("/dashboard/pos");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/orders");

  return { success: true, orderId: order.id };
}

// Alias untuk POSClient.tsx
export const createPOSTransaction = createOrder;