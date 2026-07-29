import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

export default async function OrdersPage() {
  const supabase = await createClient();
  const tenant = await getCurrentTenant();

  if (!tenant) return <div className="p-6">Tenant tidak ditemukan.</div>;

  // Ambil transaksi beserta detail itemnya
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      order_items (
        id,
        product_name,
        price,
        quantity,
        subtotal
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Transaksi</h1>
        <p className="text-sm text-gray-500">Daftar seluruh penjualan dari Kasir POS.</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white border rounded-xl">
          Belum ada transaksi tersimpan.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
              <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
                <div>
                  <p className="text-xs text-gray-400 font-mono">ID: {order.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    {order.status}
                  </span>
                  <p className="text-lg font-bold text-indigo-600 mt-1">
                    Rp {Number(order.total_amount).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Detail Items */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Item Dibeli:</p>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-700">
                    <span>
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}