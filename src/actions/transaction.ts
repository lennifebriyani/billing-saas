'use server'

import { createClient } from '@/lib/supabase/server'
import { IdentifierDomainService } from '@/services/domain/identifier.service'

export async function createTransaction(tenantId: string) {
  const supabase = await createClient()

  const transactionNumber = await IdentifierDomainService.generateTransactionNumber(tenantId)

  const { data: trx, error } = await supabase
    .from('transactions')
    .insert({
      tenant_id: tenantId,
      transaction_number: transactionNumber,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, trx }
}