"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

export async function getProducts() {
  try {
    const supabase = await createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      console.warn("getProducts: Tenant tidak ditemukan.");
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil daftar produk:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error("Error getProducts:", err);
    return [];
  }
}

export async function addProduct(data: { name: string; price: number; stock: number }) {
  try {
    const supabase = await createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      throw new Error("Tenant tidak ditemukan atau sesi login telah berakhir.");
    }

    const { error } = await supabase.from("products").insert({
      tenant_id: tenant.id,
      name: data.name,
      price: Number(data.price),
      stock: Number(data.stock),
      is_active: true,
    });

    if (error) {
      console.error("Supabase Add Product Error:", error);
      throw new Error(`Gagal menyimpan ke database: ${error.message}`);
    }

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (err: any) {
    console.error("Error addProduct:", err);
    throw new Error(err.message || "Gagal menambah produk baru.");
  }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Gagal mengubah status produk:", error.message);
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
  } catch (err: any) {
    console.error("Error toggleProductStatus:", err);
    throw new Error("Gagal mengubah status produk.");
  }
}