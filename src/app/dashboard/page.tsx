import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getClaims } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { addProduct, deleteProduct, inviteMember, upgradePlan } from './actions'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { user, tenantId, role, plan } = await getClaims()
  const params = await searchParams
  const errorParam = params.error
  const successParam = params.success

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  // Query produk
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const isPro = plan === 'pro'
  const MAX_PRODUCTS = isPro ? Infinity : 3
  const currentCount = products?.length || 0
  const isLimitReached = !isPro && currentCount >= MAX_PRODUCTS
  const isAdmin = role === 'admin'

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">SaaS Billing Dashboard</h1>
            <p className="text-sm text-slate-500">Selamat datang, {user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition cursor-pointer"
            >
              Keluar
            </button>
          </form>
        </div>

        {/* Notifikasi Status */}
        {errorParam && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-800 text-sm shadow-sm">
            <p className="font-bold">⚠️ Terjadi Kesalahan</p>
            <p>{decodeURIComponent(errorParam as string)}</p>
          </div>
        )}

        {successParam === 'upgraded' && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 text-sm shadow-sm">
            <p className="font-bold">🎉 Upgrade Berhasil!</p>
            <p>Selamat! Akun tenant Anda kini berstatus <strong>PRO Plan</strong> dengan kuota produk tanpa batas.</p>
          </div>
        )}

        {/* Tenant Info & Quota Card */}
        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
              Active Tenant Claims
            </span>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-indigo-800 text-indigo-200 rounded-full text-xs font-mono font-bold uppercase">
                Role: {role}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                isPro ? 'bg-amber-400 text-amber-950' : 'bg-indigo-950 text-indigo-300'
              }`}>
                Plan: {plan}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-indigo-300">Tenant ID:</p>
            <p className="font-mono text-sm break-all font-semibold text-indigo-100">
              {tenantId || 'Belum di-assign'}
            </p>
          </div>

          {/* Kuota Indicator */}
          <div className="pt-2 border-t border-indigo-800 space-y-2">
            <div className="flex justify-between text-xs text-indigo-200">
              <span>Penggunaan Kuota Produk</span>
              <span className="font-bold font-mono">
                {currentCount} / {isPro ? '∞ (Unlimited)' : `${MAX_PRODUCTS} Produk`}
              </span>
            </div>
            {!isPro && (
              <div className="w-full bg-indigo-950 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isLimitReached ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min((currentCount / MAX_PRODUCTS) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION: Mock Banner Upgrade ke PRO (Hanya jika belum PRO & Admin) */}
        {!isPro && isAdmin && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-xl shadow-md text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">⚡ Upgrade ke Paket PRO</h3>
              <p className="text-xs text-amber-100 mt-1">
                Dapatkan akses tanpa batas untuk menambah produk dan fitur eksklusif lainnya.
              </p>
            </div>
            <form action={upgradePlan}>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white text-amber-800 hover:bg-amber-50 font-bold text-sm rounded-lg shadow transition cursor-pointer whitespace-nowrap"
              >
                Upgrade Sekarang (Rp 199k/bln)
              </button>
            </form>
          </div>
        )}

        {/* SECTION: Undang Member Baru (RBAC: Khusus Admin) */}
        {isAdmin ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-slate-800">
                👥 Undang Member Tim
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-md border border-indigo-200">
                Admin Area
              </span>
            </div>
            <form action={inviteMember} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                placeholder="Email member yang terdaftar"
                required
                className="flex-1 px-4 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                name="role"
                className="px-3 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Role: Member</option>
                <option value="admin">Role: Admin</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition cursor-pointer"
              >
                Undang
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-slate-500 text-xs text-center">
            🔒 Fitur pengelolaan tim hanya tersedia untuk akun bertipe <strong>Admin</strong>.
          </div>
        )}

        {/* Form Tambah Produk Baru */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-3">
            + Tambah Produk Baru
          </h2>

          {isLimitReached ? (
            <div className="p-4 bg-slate-100 text-slate-600 rounded-lg text-sm text-center">
              🔒 Kuota penambahan produk telah penuh ({currentCount}/{MAX_PRODUCTS}). Upgrade paket Anda untuk menambah lebih banyak produk.
            </div>
          ) : (
            <form action={addProduct} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="name"
                placeholder="Nama Produk"
                required
                className="flex-1 px-4 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                name="price"
                placeholder="Harga (Rp)"
                required
                className="w-full sm:w-48 px-4 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition cursor-pointer"
              >
                Simpan
              </button>
            </form>
          )}
        </div>

        {/* Data Produk Terisolasi RLS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Daftar Produk Tenant
            </h2>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
              RLS Isolation Active
            </span>
          </div>

          {products && products.length > 0 ? (
            <div className="grid gap-3">
              {products.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border rounded-lg flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">ID: {item.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-slate-900">
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </p>
                    {isAdmin ? (
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Read-only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4 text-center">
              Belum ada produk.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}