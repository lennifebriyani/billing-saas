'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCatalogItem(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  const type = (formData.get('type') as string) || 'PRODUCT';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return;

  const { error } = await supabase.from('catalog_items').insert({
    tenant_id: membership.tenant_id,
    name,
    sku: sku || null,
    price,
    stock,
    type,
  });

  if (error) {
    console.error('Create Catalog Item Error:', error.message);
    return;
  }

  revalidatePath('/dashboard/products');
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('catalog_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete Catalog Item Error:', error.message);
    return;
  }

  revalidatePath('/dashboard/products');
}