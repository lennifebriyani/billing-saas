'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createTenant(formData: FormData) {
  const name = formData.get('name') as string;

  if (!name) {
    return { error: 'Nama usaha / outlet wajib diisi.' };
  }

  // Generate slug otomatis dari nama usaha (Contoh: "Toko Berkah" -> "toko-berkah")
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Hapus karakter khusus
    .replace(/[\s_-]+/g, '-')     // Ganti spasi/underscore dengan dash
    .replace(/^-+|-+$/g, '');     // Hapus dash di awal/akhir

  const supabase = await createClient();

  // 1. Ambil user yang sedang login
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Sesi login kedaluwarsa. Silakan login ulang.' };
  }

  // 2. Masukkan data tenant (name DAN slug) ke tabel tenants
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ 
      name, 
      slug: slug || `tenant-${Date.now()}` // Fallback unik jika slug kosong
    })
    .select()
    .single();

  if (tenantError) {
    return { error: tenantError.message };
  }

  // 3. Hubungkan user dengan tenant ke tabel tenant_users
  const { error: mappingError } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    });

  if (mappingError) {
    return { error: mappingError.message };
  }

  // 4. Redirect otomatis ke dashboard jika berhasil
  redirect('/dashboard');
}