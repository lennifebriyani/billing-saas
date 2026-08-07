'use server'

import { createClient } from '@/lib/supabase/server'
import { IdentifierDomainService } from '@/services/domain/identifier.service'

export async function registerTenant(formData: FormData) {
  const supabase = await createClient()
  
  const storeName = formData.get('storeName') as string
  const businessTypeId = formData.get('businessTypeId') as string
  
  const slug = IdentifierDomainService.generateSlug(storeName)

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name: storeName,
      slug: slug,
      business_type_id: businessTypeId,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, tenant }
}