import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar khusus area Dashboard */}
      <Sidebar />

      {/* Area Isi Halaman (POS, Produk, Orders, dll) */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}