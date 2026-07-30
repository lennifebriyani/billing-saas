import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil Tenant ID milik user
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect('/onboarding');
  }

  const tenantId = membership.tenant_id;

  // 2. Query Data Transaksi
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, total_amount, payment_status, payment_method, created_at')
    .eq('tenant_id', tenantId);

  // 3. Query Stok Menipis (Stok < 5)
  const { data: lowStockItems } = await supabase
    .from('catalog_items')
    .select('id, name, stock')
    .eq('tenant_id', tenantId)
    .lt('stock', 5);

  const totalTransactions = transactions?.length || 0;
  const totalRevenue =
    transactions
      ?.filter((t) => t.payment_status === 'PAID')
      .reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

  const cashSales =
    transactions
      ?.filter((t) => t.payment_method === 'CASH' && t.payment_status === 'PAID')
      .reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

  const qrisSales =
    transactions
      ?.filter((t) => t.payment_method === 'QRIS' && t.payment_status === 'PAID')
      .reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-sm text-gray-500">
            Role Anda: <span className="font-semibold text-black">{membership.role}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/pos"
            className="px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition"
          >
            Buka Kasir (POS)
          </Link>
          {membership.role === 'OWNER' && (
            <Link
              href="/dashboard/team"
              className="px-4 py-2 border text-sm font-semibold rounded hover:bg-gray-50 transition"
            >
              Kelola Tim
            </Link>
          )}
        </div>
      </div>

      {/* Kartu Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border rounded-lg bg-white shadow-sm space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Omset (Lunas)</div>
          <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
        </div>

        <div className="p-5 border rounded-lg bg-white shadow-sm space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Transaksi</div>
          <div className="text-2xl font-bold">{totalTransactions}</div>
        </div>

        <div className="p-5 border rounded-lg bg-white shadow-sm space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Pembayaran CASH</div>
          <div className="text-2xl font-bold text-green-700">
            Rp {cashSales.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-5 border rounded-lg bg-white shadow-sm space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Pembayaran QRIS</div>
          <div className="text-2xl font-bold text-blue-700">
            Rp {qrisSales.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Peringatan Stok Menipis (Low Stock Alert) */}
      <div className="p-5 border rounded-lg bg-white shadow-sm space-y-3">
        <h2 className="text-base font-bold text-red-600 flex items-center gap-2">
          <span>⚠️</span> Peringatan Stok Menipis (&lt; 5 pcs)
        </h2>
        {lowStockItems && lowStockItems.length > 0 ? (
          <div className="divide-y border-t pt-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="py-2 flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded">
                  Sisa: {item.stock}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Semua stok produk masih aman.</p>
        )}
      </div>
    </div>
  );
}