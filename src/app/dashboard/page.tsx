import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import SubscribeButton from "@/components/SubscribeButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Cek Autentikasi User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Ambil Context Tenant Aktif dari Helper
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Gagal Memuat Tenant</h1>
          <p className="text-sm text-gray-600">
            Terjadi kendala saat menghubungkan akun Anda ke sistem toko. Silakan coba muat ulang halaman.
          </p>
        </div>
      </div>
    );
  }

  // 3. Ambil Ringkasan Data Khusus Milik Tenant Ini (Filtered by tenant_id)
  const [{ count: totalProducts }, { count: totalCustomers }, { count: totalTransactions }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
    ]);

  // 4. Cek Status Langganan SaaS Platform Milik Tenant
  const { data: subscription } = await supabase
    .from("tenant_subscriptions")
    .select("status, current_period_end")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const isSubscribed = subscription?.status === "active";
  const tenantInitial = tenant.name ? tenant.name.charAt(0).toUpperCase() : "T";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header Utama / Navigasi Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {tenantInitial}
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-none">
                {tenant.name}
              </h1>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Role: {tenant.role}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500 hidden sm:inline">
              User: <strong className="text-gray-700">{user.email}</strong>
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Area Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Langganan SaaS Platform */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-gray-900">Status Langganan SaaS Platform</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isSubscribed
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isSubscribed ? "Aktif" : "Uji Coba / Belum Aktif"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isSubscribed
                ? "Tenant Anda terhubung dengan akses platform penuh."
                : "Aktifkan paket langganan untuk menikmati seluruh fitur bisnis tanpa batasan."}
            </p>
          </div>
          <div>
            <SubscribeButton />
          </div>
        </div>

        {/* Ringkasan Metric POS Core */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Ringkasan Operasional Usaha
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Produk */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Produk & Layanan</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {totalProducts ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                📦
              </div>
            </div>

            {/* Card 2: Pelanggan */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Pelanggan</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {totalCustomers ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold text-xl">
                👥
              </div>
            </div>

            {/* Card 3: Transaksi */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Transaksi Selesai</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {totalTransactions ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
                🧾
              </div>
            </div>

          </div>
        </div>

        {/* Menu Navigasi Modul Core POS */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Menu Utama Usaha
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <Link
              href="/dashboard/pos"
              className="group p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl mb-2">🛒</div>
                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Kasir / Transaksi Baru
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Proses penjualan produk cepat, pilih pembayaran tunai atau pencatatan manual.
                </p>
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-4 inline-block">
                Buka Kasir &rarr;
              </span>
            </Link>

            <Link
              href="/dashboard/products"
              className="group p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl mb-2">🏷️</div>
                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Kelola Produk & Harga
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Atur daftar barang, jasa, atau layanan yang dijual oleh toko Anda.
                </p>
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-4 inline-block">
                Kelola Produk &rarr;
              </span>
            </Link>

            <Link
              href="/dashboard/customers"
              className="group p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl mb-2">👤</div>
                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Daftar Pelanggan
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Simpan riwayat kontak pelanggan untuk mempermudah transaksi berulang.
                </p>
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-4 inline-block">
                Lihat Pelanggan &rarr;
              </span>
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
}