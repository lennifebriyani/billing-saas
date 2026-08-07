import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: { query?: string; status?: string; page?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) redirect('/onboarding');

  const currentPage = Number(searchParams?.page) || 1;
  const limit = 10;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  // Bangun Query Tenant-Safe
  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantUser.tenant_id);

  if (searchParams?.query) {
    query = query.ilike('invoice_number', `%${searchParams.query}%`);
  }
  if (searchParams?.status && searchParams.status !== 'ALL') {
    query = query.eq('payment_status', searchParams.status);
  }

  const { data: invoices, count } = await query
    .order('issued_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Invoice</h1>
      </div>

      <div className="bg-white p-4 border rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        <form className="flex flex-1 gap-2">
          <input
            type="text"
            name="query"
            defaultValue={searchParams?.query || ''}
            placeholder="Cari No. Invoice..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <select 
            name="status" 
            defaultValue={searchParams?.status || 'ALL'}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">Lunas (PAID)</option>
            <option value="UNPAID">Belum Lunas (UNPAID)</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-100 border hover:bg-gray-200 text-sm font-medium rounded-lg">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b font-medium text-gray-600">
            <tr>
              <th className="p-4">No. Invoice</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Total Tagihan</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono font-medium text-blue-600">
                    {inv.invoice_number}
                  </td>
                  <td className="p-4">{new Date(inv.issued_at).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-semibold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(inv.grand_total)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${inv.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm text-blue-600 hover:underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Tidak ada data invoice.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Sederhana */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <p>Halaman {currentPage} dari {totalPages}</p>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <Link href={`?page=${currentPage - 1}&query=${searchParams?.query || ''}&status=${searchParams?.status || ''}`} className="px-3 py-1 border rounded hover:bg-gray-50">
              Sebelumnya
            </Link>
          )}
          {currentPage < totalPages && (
            <Link href={`?page=${currentPage + 1}&query=${searchParams?.query || ''}&status=${searchParams?.status || ''}`} className="px-3 py-1 border rounded hover:bg-gray-50">
              Selanjutnya
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}