import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) redirect('/onboarding');

  // Mengambil Invoice sekaligus Join ke Transactions dan Transaction Items
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      transactions (
        transaction_items (
          product_name_snapshot,
          quantity,
          price,
          subtotal
        )
      )
    `)
    .eq('id', params.id)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();

  if (error || !invoice) {
    return <div className="p-8 text-center text-red-500 font-medium">Invoice tidak ditemukan atau Anda tidak memiliki akses.</div>;
  }

  const items = invoice.transactions?.transaction_items || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Daftar Invoice
      </Link>

      <div className="bg-white border rounded-xl shadow-sm p-8">
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-sm text-gray-500 mt-1">No: {invoice.invoice_number}</p>
            <p className="text-sm text-gray-500">Tanggal: {new Date(invoice.issued_at).toLocaleDateString('id-ID')}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 text-sm font-bold rounded-md border ${invoice.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
              {invoice.payment_status}
            </span>
          </div>
        </div>

        {/* Info Pelanggan (Jika Ada) */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500 mb-1">Ditagihkan Kepada:</p>
          <p className="font-semibold text-gray-900">
            {invoice.customer_id ? 'Pelanggan Terdaftar (ID Terlampir)' : 'Pelanggan Umum (Walk-in)'}
          </p>
        </div>

        {/* Tabel Item */}
        <table className="w-full text-sm text-left mb-8">
          <thead className="border-b-2 font-semibold text-gray-700">
            <tr>
              <th className="py-3">Deskripsi Barang</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Harga Satuan</th>
              <th className="py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="py-3 text-gray-900">{item.product_name_snapshot}</td>
                <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
                </td>
                <td className="py-3 text-right font-medium text-gray-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ringkasan Biaya */}
        <div className="flex justify-end text-sm">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pajak:</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Diskon:</span>
              <span>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(invoice.discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
              <span>Total:</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(invoice.grand_total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}