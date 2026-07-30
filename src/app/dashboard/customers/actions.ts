'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCustomer(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return;

  const { error } = await supabase.from('customers').insert({
    tenant_id: membership.tenant_id,
    name,
    email: email || null,
    phone: phone || null,
  });

  if (error) {
    console.error('Add Customer Error:', error.message);
    return;
  }

  revalidatePath('/dashboard/customers');
}