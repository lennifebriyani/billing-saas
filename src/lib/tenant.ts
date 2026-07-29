import { createClient } from "@/lib/supabase/server";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/**
  Mengambil data Tenant milik user yang sedang login.
  Jika user belum punya tenant (misal: akun lama), otomatis buatkan 1 Tenant default.
 */
export async function getCurrentTenant(): Promise<TenantInfo | null> {
  const supabase = await createClient();

  // 1. Cek User yang sedang Login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 2. Ambil data tenant_users milik user ini
  const { data: tenantUsers, error: tenantError } = await supabase
    .from("tenant_users")
    .select("role, tenant_id, tenants(id, name, slug, status)")
    .eq("user_id", user.id)
    .limit(1);

  if (tenantError) {
    console.error("Error fetching tenant user:", tenantError);
  }

  // 3. Jika sudah punya tenant, kembalikan datanya
  if (tenantUsers && tenantUsers.length > 0) {
    const tu = tenantUsers[0];
    const t = tu.tenants as unknown as { id: string; name: string; slug: string; status: string };

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      role: tu.role,
    };
  }

  // 4. JIKA BELUM PUNYA TENANT (Auto-Onboarding untuk user lama)
  const defaultSlug = `tenant-${user.id.slice(0, 8)}`;
  const defaultName = user.email ? `Toko ${user.email.split("@")[0]}` : "Toko Saya";

  // Insert ke tabel tenants
  const { data: newTenant, error: createTenantErr } = await supabase
    .from("tenants")
    .insert({
      name: defaultName,
      slug: defaultSlug,
      status: "active",
    })
    .select()
    .single();

  if (createTenantErr || !newTenant) {
    console.error("Gagal membuat tenant default:", createTenantErr);
    return null;
  }

  // Hubungkan user ke tenant baru sebagai 'owner'
  const { error: linkUserErr } = await supabase.from("tenant_users").insert({
    tenant_id: newTenant.id,
    user_id: user.id,
    role: "owner",
  });

  if (linkUserErr) {
    console.error("Gagal menghubungkan user ke tenant:", linkUserErr);
    return null;
  }

  return {
    id: newTenant.id,
    name: newTenant.name,
    slug: newTenant.slug,
    role: "owner",
  };
}