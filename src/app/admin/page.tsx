import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

// Gunakan Service Role Key untuk bypass RLS dan membaca seluruh data platform
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()

  // 1. Verifikasi Auth User & Akses Super Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    // Jika bukan super admin, lemparkan kembali ke dashboard tenant
    redirect('/dashboard')
  }

  // 2. Fetch Metrik Platform-Wide
  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('*, profiles(id, name, email)')
    .order('created_at', { ascending: false })

  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('amount, status')

  const { count: totalCustomers } = await supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact', head: true })

  // Hitung Agregasi Metrik
  const totalTenants = tenants?.length || 0
  const totalInvoicesCount = invoices?.length || 0
  const totalPlatformRevenue = invoices
    ?.filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6 md:p-10 space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold text-xs rounded-full uppercase tracking-wider">
            🛡️ Super Admin Control Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Platform Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau seluruh aktivitas toko/tenant dan pendapatan global BillingSaaS.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors self-start md:self-auto"
        >
          ← Ke Dashboard Tenant
        </Link>
      </div>

      {/* Grid Metrik Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tenant (Toko)</p>
          <p className="text-3xl font-black text-slate-900">{totalTenants}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Omset Platform</p>
          <p className="text-3xl font-black text-emerald-600">
            Rp {totalPlatformRevenue.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tagihan Diterbitkan</p>
          <p className="text-3xl font-black text-indigo-600">{totalInvoicesCount}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Database Pelanggan</p>
          <p className="text-3xl font-black text-slate-900">{totalCustomers || 0}</p>
        </div>
      </div>

      {/* Tabel Daftar Seluruh Tenant */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Daftar Tenant Terdaftar</h2>
          <span className="text-xs font-mono text-slate-400">Total: {totalTenants} toko</span>
        </div>

        {!tenants || tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Belum ada tenant yang terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="p-4">Nama Toko / Tenant</th>
                  <th className="p-4">Tenant ID</th>
                  <th className="p-4">Tanggal Pendaftaran</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{tenant.name || 'Toko Tanpa Nama'}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{tenant.id}</td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(tenant.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        Aktif
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