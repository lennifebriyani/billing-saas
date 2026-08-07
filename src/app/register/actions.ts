'use server';

import { createClient } from '@/lib/supabase/server'

export async function registerUser(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const storeName = formData.get('storeName') as string;

    if (!email || !password || !fullName || !storeName) {
      return { error: 'Semua field wajib diisi secara lengkap.' };
    }

    const supabase = await createClient();

    // 1. Pendaftaran Akun Auth Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { error: 'Gagal mendapatkan ID pengguna dari Auth.' };
    }

    // 2. Membuat Tenant / Toko Baru
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([{ name: storeName }])
      .select()
      .single();

    if (tenantError || !tenantData) {
      return { error: 'Gagal membuat toko: ' + (tenantError?.message || 'Unknown error') };
    }

    // 3. Menghubungkan User dengan Tenant (sebagai owner)
    const { error: tuError } = await supabase
      .from('tenant_users')
      .insert([
        {
          tenant_id: tenantData.id,
          user_id: userId,
          role: 'owner',
        },
      ]);

    if (tuError) {
      return { error: 'Gagal menghubungkan user dengan toko: ' + tuError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem yang tidak diketahui.' };
  }
}