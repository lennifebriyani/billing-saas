import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Ambil Profil & Tenant ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, tenants(name)')
    .eq('id', user?.id || '')
    .maybeSingle()

  const tenantId = profile?.tenant_id
  const tenant = profile?.tenants as unknown as { name: string } | null

  // State Agregat Data Real-time
  let totalRevenue = 0
  let paidCount = 0
  let unpaidCount = 0
  let customerCount = 0
  let recentInvoices: any[] = []

  if (tenantId) {
    // 2. Hitung Total Pelanggan
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    customerCount = count || 0

    // 3. Ambil Data Invoices untuk Kalkulasi Metrik & Aktivitas Terbaru
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })

    if (invoices) {
      recentInvoices = invoices.slice(0, 5) // Ambil 5 teratas
      
      invoices.forEach((inv) => {
        if (inv.status === 'paid') {
          totalRevenue += Number(inv.amount || 0)
          paidCount++
        } else if (inv.status === 'unpaid') {
          unpaidCount++
        }
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Ringkasan Toko
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Pantau kinerja keuangan & billing untuk toko <span className="font-semibold text-slate-800">{tenant?.name || 'Utama'}</span>
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard/invoices"
            className="inline-block px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            + Buat Tagihan Baru
          </Link>
        </div>
      </div>

      {/* Metric Cards Real-time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pendapatan</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">Rp</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Status tagihan lunas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tagihan Lunas</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">✓</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{paidCount}</p>
          <p className="text-xs text-slate-400 mt-1">Invoice terbayar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Bayar</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-bold">!</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{unpaidCount}</p>
          <p className="text-xs text-slate-400 mt-1">Belum dilunasi</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pelanggan</span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">👥</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{customerCount}</p>
          <p className="text-xs text-slate-400 mt-1">Pelanggan terdaftar</p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Tagihan Terbaru</h3>
            <p className="text-xs text-slate-500">5 transaksi invoice terakhir</p>
          </div>
          <Link href="/dashboard/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Lihat Semua →
          </Link>
        </div>
        
        {recentInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
              🧾
            </div>
            <h4 className="text-slate-700 font-semibold text-sm">Belum ada transaksi invoice</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Invoice yang dibuat akan muncul di sini dan otomatis memperbarui statistik toko.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">No. Invoice</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4 text-slate-800">{inv.customers?.name || 'Pelanggan Umum'}</td>
                    <td className="p-4 font-bold text-slate-900">
                      Rp {Number(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}