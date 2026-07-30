import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintButton from './PrintButton'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Invoice Detail + Relasi Customer & Tenant
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customers(*), tenants(name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !invoice) {
    notFound()
  }

  const customer = invoice.customers as { name: string; email?: string; phone?: string; address?: string } | null
  const tenant = invoice.tenants as { name: string } | null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Action Bar (Sembunyi saat dicetak) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/invoices"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          ← Kembali ke Daftar Tagihan
        </Link>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">INVOICE</h1>
            <p className="text-sm font-mono text-slate-500 mt-1">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-indigo-600">{tenant?.name || 'Toko Utama'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sistem Billing SaaS</p>
          </div>
        </div>

        {/* Client & Date Info */}
        <div className="grid grid-cols-2 gap-8 my-8 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ditujukan Kepada:</p>
            <p className="font-bold text-slate-900 text-base">{customer?.name || 'Pelanggan Umum'}</p>
            {customer?.email && <p className="text-slate-600 text-xs mt-0.5">{customer.email}</p>}
            {customer?.phone && <p className="text-slate-600 text-xs mt-0.5">{customer.phone}</p>}
            {customer?.address && <p className="text-slate-500 text-xs mt-1 max-w-xs">{customer.address}</p>}
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-xs text-slate-400">Tanggal Terbit: </span>
              <span className="font-medium text-slate-700">
                {new Date(invoice.created_at).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400">Jatuh Tempo: </span>
              <span className="font-medium text-slate-700">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
            <div className="pt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {invoice.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Item Table */}
        <div className="border rounded-lg border-slate-200 overflow-hidden my-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="p-3.5">Deskripsi / Layanan</th>
                <th className="p-3.5 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5 text-slate-800">
                  Tagihan Pembayaran Layanan ({invoice.invoice_number})
                </td>
                <td className="p-3.5 text-right font-bold text-slate-900">
                  Rp {Number(invoice.amount).toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Tagihan</span>
              <span>Rp {Number(invoice.amount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          Terima kasih atas kerja sama Anda. Harap simpan invoice ini sebagai bukti transaksi resmi.
        </div>
      </div>
    </div>
  )
}