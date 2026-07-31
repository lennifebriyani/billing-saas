import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardMetrics } from '@/lib/dashboard';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Dapatkan tenant_id user dari tenant_users
  const { data: tenantUser, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (tenantError || !tenantUser) {
    redirect('/onboarding');
  }

  const metrics = await getDashboardMetrics(tenantUser.tenant_id);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
          <p className="text-2xl font-bold mt-1">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(metrics.totalRevenue)}
          </p>
        </div>

        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Transaksi Selesai</p>
          <p className="text-2xl font-bold mt-1">{metrics.totalTransactions}</p>
        </div>

        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
          <p className="text-2xl font-bold mt-1">{metrics.activeCustomers}</p>
        </div>
      </div>
    </div>
  );
}