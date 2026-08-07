'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreatePaymentParams {
  tenantId: string
  invoiceId: string
  amount: number
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER'
  referenceNumber?: string
  notes?: string
}

export async function createPayment({ tenantId, invoiceId, amount, paymentMethod, referenceNumber, notes }: CreatePaymentParams) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  if (!tenantId || !invoiceId || amount <= 0 || !paymentMethod) {
    return { error: 'Invalid payment parameters' }
  }

  // 1. Ambil data invoice terkait secara tenant-safe
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (invError || !invoice) {
    return { error: 'Invoice not found' }
  }

  const currentPaid = Number(invoice.paid_amount || 0)
  const totalAmount = Number(invoice.total_amount || 0)
  const remainingBalance = totalAmount - currentPaid

  if (amount > remainingBalance) {
    return { error: `Payment amount exceeds remaining balance (${remainingBalance})` }
  }

  // 2. Insert record pembayaran ke tabel payments
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status: 'SUCCESS',
      notes,
      created_by: user.id
    })

  if (paymentError) {
    return { error: paymentError.message }
  }

  // 3. Update paid_amount dan status invoice (UNPAID / PARTIALLY_PAID / PAID)
  const newPaidAmount = currentPaid + amount
  let newStatus = invoice.status

  if (newPaidAmount >= totalAmount) {
    newStatus = 'PAID'
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIALLY_PAID'
  }

  const { error: updateInvError } = await supabase
    .from('invoices')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus
    })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)

  if (updateInvError) {
    return { error: updateInvError.message }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  return { success: true }
}