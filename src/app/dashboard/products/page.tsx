import { createClient } from '@/lib/supabase/server';
import { createCatalogItem, deleteCatalogItem } from './actions';

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from('catalog_items')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Katalog Produk & Layanan</h1>
          <p className="text-sm text-gray-500">Kelola item produk, stok, dan harga layanan tenant Anda.</p>
        </div>
      </div>

      {/* Form Tambah Item */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Tambah Item Baru</h2>
        <form action={createCatalogItem} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Nama Item / Produk"
            required
            className="p-2 border rounded text-sm"
          />
          <input
            type="text"
            name="sku"
            placeholder="SKU / Kode (Opsional)"
            className="p-2 border rounded text-sm"
          />
          <input
            type="number"
            name="price"
            placeholder="Harga (Rp)"
            required
            min="0"
            step="100"
            className="p-2 border rounded text-sm"
          />
          <input
            type="number"
            name="stock"
            placeholder="Stok Awal"
            required
            min="0"
            className="p-2 border rounded text-sm"
          />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
          >
            + Simpan Item
          </button>
        </form>
      </div>

      {/* Tabel Catalog Items */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-semibold">Nama</th>
              <th className="p-3 font-semibold">SKU</th>
              <th className="p-3 font-semibold">Tipe</th>
              <th className="p-3 font-semibold">Harga</th>
              <th className="p-3 font-semibold">Stok</th>
              <th className="p-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {error && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-red-500">
                  Gagal memuat data katalog: {error.message}
                </td>
              </tr>
            )}
            {items && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Belum ada item katalog. Silakan tambah item pertama Anda di atas.
                </td>
              </tr>
            )}
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-gray-500">{item.sku || '-'}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.type}
                  </span>
                </td>
                <td className="p-3">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                <td className="p-3">
                  <span className={`font-semibold ${item.stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.stock}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <form action={deleteCatalogItem.bind(null, item.id)}>
                    <button type="submit" className="text-red-600 hover:underline text-xs font-medium">
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