import { createClient } from '@/lib/supabase/server'

export interface Tenant {
  id: string
  name: string
  slug: string
  business_type: string
  status: string
  created_at: string
}

export interface TenantWithRole extends Tenant {
  role: string
}

/**
 * Mengambil data tenant aktif beserta role user di tenant tersebut
 */
export async function getCurrentTenant(): Promise<TenantWithRole | null> {
  const supabase = await createClient()

  // 1. Cek User yang sedang Login
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // 2. Ambil data Membership & Tenant
  const { data: membership, error: memberError } = await supabase
    .from('memberships')
    .select('role, tenants(id, name, slug, business_type, status, created_at)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError || !membership || !membership.tenants) {
    return null
  }

  const tenantData = Array.isArray(membership.tenants)
    ? membership.tenants[0]
    : membership.tenants

  return {
    ...(tenantData as Tenant),
    role: membership.role,
  }
}