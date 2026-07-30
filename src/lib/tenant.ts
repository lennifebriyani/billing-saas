import { createClient } from '@/lib/supabase/server';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenantWithRole extends Tenant {
  role: string;
}

/**
 * Mengambil data tenant aktif beserta role user di tenant tersebut
 */
export async function getCurrentTenant(): Promise<TenantWithRole | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ambil membership sekaligus role dan data tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .single();

  if (!membership || !membership.tenants) return null;

  const tenantObj = Array.isArray(membership.tenants)
    ? (membership.tenants[0] as unknown as Tenant)
    : (membership.tenants as unknown as Tenant);

  if (!tenantObj) return null;

  // Gabungkan data tenant dengan role dari membership
  return {
    ...tenantObj,
    role: membership.role || 'STAFF',
  };
}

/**
 * Mengambil data langganan tenant
 */
export async function getTenantSubscription() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  const tenantObj = Array.isArray(membership.tenants)
    ? (membership.tenants[0] as unknown as Tenant)
    : (membership.tenants as unknown as Tenant);

  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', membership.tenant_id)
    .single();

  return {
    tenant: tenantObj ? { ...tenantObj, role: membership.role || 'STAFF' } : null,
    subscription,
  };
}