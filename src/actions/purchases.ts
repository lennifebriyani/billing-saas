'use server'

import { createClient } from '@/lib/supabase/server'
import { IdentifierDomainService } from '@/services/domain/identifier.service'

export async function createPurchaseOrder(tenantId: string, supplierId: string) {
  const supabase = await createClient()

  const poNumber = await IdentifierDomainService.generatePurchaseNumber(tenantId)

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      tenant_id: tenantId,
      po_number: poNumber,
      supplier_id: supplierId,
      status: 'DRAFT',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, po }
}