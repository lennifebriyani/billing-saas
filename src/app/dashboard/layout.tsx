import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Verifikasi User Auth Sesi Server
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // 2. Cek keanggotaan tenant menggunakan .maybeSingle() agar tidak throw error jika 0 row
  const { data: tenantUser, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (tenantError) {
    console.error('[DashboardLayout] Error fetching tenant_users:', tenantError.message);
  }

  // Jika user belum terhubung ke tenant mana pun, arahkan ke onboarding
  if (!tenantUser) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Container utama dashboard */}
      <main className="flex-1">{children}</main>
    </div>
  );
}