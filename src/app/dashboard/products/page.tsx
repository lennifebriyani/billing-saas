import { createClient } from '@/lib/supabase/server';
import { createCatalogItem, deleteCatalogItem } from './actions';

export const revalidate = 0;

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  const { data: items } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('tenant_id', membership.tenant_id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight border-b pb-4">Katalog Produk & Layanan</h1>

      {/* Form Tambah Item */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-base font-semibold mb-3">Tambah Produk Baru</h2>
        <form action={createCatalogItem} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Nama Produk"
            className="p-2 border rounded text-xs"
          />
          <input
            type="text"
            name="sku"
            placeholder="SKU (Opsional)"
            className="p-2 border rounded text-xs"
          />
          <input
            type="number"
            name="price"
            required
            placeholder="Harga (Rp)"
            className="p-2 border rounded text-xs"
          />
          <input
            type="number"
            name="stock"
            required
            placeholder="Stok Awalan"
            className="p-2 border rounded text-xs"
          />
          <button
            type="submit"
            className="p-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
          >
            + Simpan
          </button>
        </form>
      </div>

      {/* Tabel Produk */}
      <div className="p-4 border rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3">Nama Produk</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Stok</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 font-mono text-gray-500">{item.sku || '-'}</td>
                <td className="p-3 font-semibold">
                  Rp {Number(item.price).toLocaleString('id-ID')}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      item.stock < 5
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.stock} {item.stock < 5 && '⚠️ Limit'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <form action={async () => {
                    'use server';
                    await deleteCatalogItem(item.id);
                  }}>
                    <button
                      type="submit"
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}