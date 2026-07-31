'use client'

import { useState, useEffect } from 'react'
import { getInvoices, getInvoiceDetails } from './actions'

interface InvoiceSummary {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  order_items: { id: string }[]
}

interface InvoiceDetail {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    subtotal: number
    product_id: string
    products:
      | { name: string; sku: string | null }
      | { name: string; sku: string | null }[]
      | null
  }[]
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true)
      const data = await getInvoices()
      setInvoices((data as unknown) as InvoiceSummary[])
      setLoading(false)
    }
    loadInvoices()
  }, [])

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true)
    const detail = await getInvoiceDetails(id)
    setSelectedInvoice((detail as unknown) as InvoiceDetail)
    setLoadingDetail(false)
  }

  const handlePrint = () => {
    window.print()
  }

  // Helper untuk mengekstrak nama produk dengan aman (baik array maupun object)
  const getProductName = (products: InvoiceDetail['order_items'][number]['products']) => {
    if (!products) return 'Produk dihapus'
    if (Array.isArray(products)) {
      return products[0]?.name || 'Produk dihapus'
    }
    return products.name || 'Produk dihapus'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Riwayat Invoice & Transaksi</h1>
          <p className="text-sm text-gray-500">Kelola dan tinjau seluruh bukti transaksi penjualan tenant Anda.</p>
        </div>
      </div>

      {/* Tabel Utama Invoices */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data invoice...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada transaksi tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-6 py-3">ID Transaksi</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Metode Bayar</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      #{inv.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(inv.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      Rp {inv.total_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(inv.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      >
                        Lihat Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Invoice & Struk */}
      {(selectedInvoice || loadingDetail) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 print:p-0 print:shadow-none print:w-full print:max-w-none">
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-500">Memuat detail struk...</div>
            ) : selectedInvoice ? (
              <>
                <div className="text-center border-b pb-4 print:border-b-2">
                  <h2 className="text-xl font-bold text-gray-900">STRUK PENJUALAN</h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">ID: #{selectedInvoice.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedInvoice.created_at).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-2 py-2 text-sm">
                  {selectedInvoice.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getProductName(item.products)}
                        </p>
                        <p className="text-gray-500">
                          {item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total & Payment Details */}
                <div className="border-t pt-3 space-y-1.5 text-xs print:border-t-2">
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                    <span>Total Transaksi</span>
                    <span>Rp {selectedInvoice.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Metode Pembayaran</span>
                    <span className="uppercase font-semibold">{selectedInvoice.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Status</span>
                    <span className="uppercase font-semibold">{selectedInvoice.status}</span>
                  </div>
                </div>

                {/* Action Buttons (Hidden when printing) */}
                <div className="flex space-x-2 pt-4 border-t print:hidden">
                  <button
                    onClick={handlePrint}
                    className="flex-1 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 transition"
                  >
                    Cetak / Print
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="py-2 px-4 bg-gray-100 text-gray-700 font-medium text-sm rounded hover:bg-gray-200 transition"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}