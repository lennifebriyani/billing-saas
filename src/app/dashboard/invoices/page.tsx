'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'unpaid' | 'paid' | 'cancelled'
  due_date: string | null
  created_at: string
  customers: { name: string } | null
}

interface Customer {
  id: string
  name: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form State
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // 1. Fetch Invoices & Customers
  const fetchData = async () => {
    setLoading(true)

    // Fetch Invoices beserta Relasi Customer
    const { data: invData } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })

    // Fetch Customer List untuk Dropdown Form
    const { data: custData } = await supabase
      .from('customers')
      .select('id, name')
      .order('name', { ascending: true })

    setInvoices((invData as unknown as Invoice[]) || [])
    setCustomers(custData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Handle Tambah Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !customerId) return

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User tidak ditemukan')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) throw new Error('Tenant ID tidak ditemukan')

      // Generate Nomor Invoice Unik (Format: INV-YYMMDD-XXX)
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
      const randomNum = Math.floor(100 + Math.random() * 900)
      const invoiceNum = `INV-${dateStr}-${randomNum}`

      const { error } = await supabase.from('invoices').insert([
        {
          tenant_id: profile.tenant_id,
          customer_id: customerId,
          invoice_number: invoiceNum,
          amount: parseFloat(amount),
          due_date: dueDate || null,
          status: 'unpaid'
        }
      ])

      if (error) throw error

      // Reset Form & Close Modal
      setCustomerId('')
      setAmount('')
      setDueDate('')
      setShowModal(false)
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Gagal membuat invoice')
    } finally {
      setSubmitting(false)
    }
  }

  // 3. Toggle Status (Lunas / Belum Lunas)
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'unpaid' ? 'paid' : 'unpaid'
    
    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Gagal mengubah status invoice')
    } else {
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tagihan</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Buat, lacak, dan kelola invoice pembayaran pelanggan toko kamu.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          + Buat Invoice Baru
        </button>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Memuat data tagihan...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              🧾
            </div>
            <h4 className="text-slate-700 font-semibold text-sm">Belum ada invoice</h4>
            <p className="text-slate-400 text-xs mt-1">
              Klik "+ Buat Invoice Baru" untuk membuat tagihan pembayaran pertama.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">No. Invoice</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Total Tagihan</th>
                  <th className="p-4">Jatuh Tempo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4 font-medium text-slate-800">{inv.customers?.name || 'Pelanggan Umum'}</td>
                    <td className="p-4 font-bold text-slate-900">
                      Rp {Number(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="text-xs px-2.5 py-1.5 rounded-md font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Detail
                        </Link>
                        <button
                          onClick={() => toggleStatus(inv.id, inv.status)}
                          className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${
                            inv.status === 'paid'
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {inv.status === 'paid' ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BUAT INVOICE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Buat Invoice Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pilih Pelanggan *
                </label>
                {customers.length === 0 ? (
                  <p className="text-xs text-red-500 italic">
                    Belum ada pelanggan. Tambahkan pelanggan dulu di menu Pelanggan.
                  </p>
                ) : (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nominal Tagihan (Rp) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !amount || !customerId}
                  className="px-4 py-2 text-xs font-medium bg-black text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
                >
                  {submitting ? 'Memproses...' : 'Simpan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}