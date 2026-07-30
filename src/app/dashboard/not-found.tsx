import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
      <h2 className="text-lg font-semibold mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-gray-500 max-w-sm mb-6">
        Halaman atau modul dashboard yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}