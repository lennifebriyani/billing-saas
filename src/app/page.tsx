import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">
              Billing<span className="text-indigo-600">SaaS</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-slate-900 transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-slate-900 transition-colors">Harga</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 max-w-5xl mx-auto px-6 text-center space-y-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
            🚀 Platform Billing & CRM Multi-Tenant
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Kelola Tagihan & Pelanggan Bisnis Kamu Tanpa Ribet
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Solusi SaaS terpadu untuk membuat invoice profesional, memantau pendapatan toko secara real-time, dan mengelola database pelanggan dengan aman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-base font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md"
            >
              Coba Gratis Sekarang →
            </Link>
            <Link
              href="#fitur"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 text-base font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Pelajari Fitur
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Segala yang Kamu Butuhkan untuk Tumbuh</h2>
              <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
                Dirancang khusus untuk pemilik usaha, agen, dan penyedia jasa yang membutuhkan kecepatan serta keamanan data.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold">
                  🧾
                </div>
                <h3 className="text-lg font-bold text-slate-900">Invoice Otomatis & Cetak PDF</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Buat tagihan instan dengan penomoran otomatis unik. Lengkap dengan cetak siap pakai dan format tampilan resmi.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                  📊
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dashboard Real-time</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pantau pemasukan, status tagihan (lunas / belum bayar), serta metrik pelanggan usaha kamu dalam satu ringkasan visual.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-lg font-bold text-slate-900">Isolasi Data Multi-Tenant</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Keamanan data level tinggi menggunakan Supabase Row Level Security (RLS). Data toko kamu dijamin terisolasi sempurna.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="harga" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Pilih Paket yang Sesuai Kebutuhan</h2>
              <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
                Tanpa biaya tersembunyi. Mulai gratis dan tingkatkan seiring berkembangnya bisnis kamu.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                  <p className="text-xs text-slate-500 mt-1">Untuk UMKM & Bisnis Baru</p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-900">Rp 0</span>
                    <span className="text-xs text-slate-400"> / bulan</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600">
                    <li className="flex items-center gap-2">✓ Hingga 50 Invoice / bulan</li>
                    <li className="flex items-center gap-2">✓ Database Pelanggan Unlimited</li>
                    <li className="flex items-center gap-2">✓ Cetak & Simpan PDF</li>
                    <li className="flex items-center gap-2">✓ Support Email</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="w-full py-2.5 bg-slate-100 text-slate-800 text-center text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Mulai Sekarang
                </Link>
              </div>

              {/* Pro */}
              <div className="p-8 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-col justify-between space-y-6 relative border border-slate-800">
                <span className="absolute -top-3 right-6 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Paling Populer
                </span>
                <div>
                  <h3 className="text-lg font-bold">Pro Tenant</h3>
                  <p className="text-xs text-slate-400 mt-1">Untuk Bisnis Skala Menengah</p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold">Rp 149.000</span>
                    <span className="text-xs text-slate-400"> / bulan</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Invoice Tanpa Batas</li>
                    <li className="flex items-center gap-2">✓ Laporan Pendapatan Detail</li>
                    <li className="flex items-center gap-2">✓ Kustomisasi Branding Toko</li>
                    <li className="flex items-center gap-2">✓ Prioritas Support 24/7</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="w-full py-2.5 bg-white text-slate-900 text-center text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Coba Gratis Pro
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
                  <p className="text-xs text-slate-500 mt-1">Untuk Perusahaan Besar</p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600">
                    <li className="flex items-center gap-2">✓ Integrasi API & Webhook</li>
                    <li className="flex items-center gap-2">✓ Multi-User / Staf Akses</li>
                    <li className="flex items-center gap-2">✓ SLA 99.9% Availability</li>
                    <li className="flex items-center gap-2">✓ Dedicated Account Manager</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="w-full py-2.5 bg-slate-100 text-slate-800 text-center text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Hubungi Tim Kami
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BillingSaaS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-800">Privasi</a>
            <a href="#" className="hover:text-slate-800">Ketentuan Layanan</a>
            <a href="#" className="hover:text-slate-800">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  )
}