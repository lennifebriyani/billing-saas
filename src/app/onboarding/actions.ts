'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createTenantOnboarding(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Buat Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name, slug })
    .select('id')
    .single();

  if (tenantError || !tenant) {
    console.error('Error creating tenant:', tenantError?.message);
    return;
  }

  // 2. Hubungkan User sebagai OWNER di tenant_memberships
  const { error: memberError } = await supabase.from('tenant_memberships').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: 'OWNER',
  });

  if (memberError) {
    console.error('Error assigning membership:', memberError.message);
    return;
  }

  redirect('/dashboard');
}