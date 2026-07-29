import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import { addCustomer } from "./actions";

export default async function CustomersPage() {
  const supabase = await createClient();

  // 1. Cek User Login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Ambil Tenant Aktif
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect("/dashboard");
  }

  // 3. Ambil Daftar Pelanggan khusus milik tenant ini
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header Navigasi */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium transition"
            >
              &larr; Kembali ke Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-bold text-gray-900">
              Daftar Pelanggan ({tenant.name})
            </h1>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulir Tambah Pelanggan (Kolom Kiri) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Tambah Pelanggan Baru</h2>
          <p className="text-xs text-gray-500 mb-6">
            Data pelanggan ini akan tersimpan khusus untuk toko <strong className="text-gray-700">{tenant.name}</strong>.
          </p>

          <form action={addCustomer} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                Nomor HP / WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="081234567890"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email (Opsional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="budi@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-lg transition shadow-sm"
            >
              + Simpan Pelanggan
            </button>
          </form>
        </div>

        {/* Tabel Daftar Pelanggan (Kolom Kanan) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daftar Pelanggan Terdaftar</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total {customers?.length ?? 0} pelanggan terdaftar.
              </p>
            </div>
          </div>

          {!customers || customers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm font-medium text-gray-700">Belum Ada Pelanggan</p>
              <p className="text-xs text-gray-500 mt-1">
                Gunakan formulir di samping untuk menambahkan pelanggan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-6 font-semibold">Nama</th>
                    <th className="py-3 px-6 font-semibold">No. HP / WA</th>
                    <th className="py-3 px-6 font-semibold">Email</th>
                    <th className="py-3 px-6 font-semibold">Tanggal Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 font-semibold text-gray-900">{customer.name}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {customer.phone ? customer.phone : "-"}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {customer.email ? customer.email : "-"}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}