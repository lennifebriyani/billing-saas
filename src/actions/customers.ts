'use server'

import { createClient } from '@/lib/supabase/server'
import { IdentifierDomainService } from '@/services/domain/identifier.service'

export async function createCustomer(tenantId: string, name: string, phone: string) {
  const supabase = await createClient()

  const customerCode = await IdentifierDomainService.generateCustomerCode(tenantId)

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      customer_code: customerCode,
      name,
      phone,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, customer }
}