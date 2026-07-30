'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addTeamMember(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const userId = formData.get('userId') as string;
  const role = (formData.get('role') as string) || 'CASHIER';

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  // Hanya OWNER yang boleh tambah anggota tim
  if (!membership || membership.role !== 'OWNER') return;

  const { error } = await supabase.from('tenant_memberships').insert({
    tenant_id: membership.tenant_id,
    user_id: userId,
    role: role,
  });

  if (error) {
    console.error('Error adding team member:', error.message);
    return;
  }

  revalidatePath('/dashboard/team');
}