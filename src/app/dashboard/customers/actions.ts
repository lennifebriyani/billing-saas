"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

/**
 * Menambahkan pelanggan baru khusus untuk tenant yang sedang aktif
 */
export async function addCustomer(formData: FormData) {
  const supabase = await createClient();
  const tenant = await getCurrentTenant();

  if (!tenant) {
    throw new Error("Tenant tidak ditemukan atau sesi login telah berakhir.");
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!name) {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  const { error } = await supabase.from("customers").insert({
    tenant_id: tenant.id,
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    email: email ? email.trim() : null,
  });

  if (error) {
    console.error("Gagal menambah pelanggan:", error);
    throw new Error("Gagal menyimpan data pelanggan.");
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}