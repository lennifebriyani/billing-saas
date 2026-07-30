import { createClient } from '@/lib/supabase/server';

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id,
      transaction_number,
      total,
      status,
      payment_status,
      created_at,
      customers ( name ),
      transaction_items (
        id,
        item_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi (Orders)</h1>
        <p className="text-sm text-gray-500">Daftar seluruh transaksi kasir dan status pembayaran tenant.</p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-semibold">No. Transaksi</th>
              <th className="p-3 font-semibold">Pelanggan</th>
              <th className="p-3 font-semibold">Detail Item</th>
              <th className="p-3 font-semibold">Total</th>
              <th className="p-3 font-semibold">Status Bayar</th>
              <th className="p-3 font-semibold">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {error && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-red-500">
                  Gagal memuat riwayat transaksi: {error.message}
                </td>
              </tr>
            )}
            {transactions && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Belum ada riwayat transaksi yang tercatat.
                </td>
              </tr>
            )}
            {transactions?.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono font-medium text-xs text-blue-600">{tx.transaction_number}</td>
                <td className="p-3">
                  {/* @ts-expect-error customer relation type handle */}
                  {tx.customers?.name || 'Umum / Non-Member'}
                </td>
                <td className="p-3 text-xs">
                  {tx.transaction_items?.map((item: { id: string; item_name: string; quantity: number }) => (
                    <div key={item.id}>
                      {item.item_name} x {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="p-3 font-semibold">Rp {Number(tx.total).toLocaleString('id-ID')}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      tx.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {tx.payment_status}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {new Date(tx.created_at).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}