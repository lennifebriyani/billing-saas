import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) {
    redirect('/onboarding');
  }

  // Mengambil histori transaksi murni dari tabel `transactions`
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, transaction_number, total_amount, status, payment_status, created_at')
    .eq('tenant_id', tenantUser.tenant_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error.message);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-medium">
            <tr>
              <th className="p-4">No. Transaksi</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status Transaksi</th>
              <th className="p-4">Status Pembayaran</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono font-medium">{tx.transaction_number || tx.id.slice(0, 8)}</td>
                  <td className="p-4">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-semibold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.total_amount)}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                      {tx.payment_status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Belum ada transaksi tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}