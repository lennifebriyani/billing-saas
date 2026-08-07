'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const tenantId = formData.get('tenantId') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const status = formData.get('status') as string || 'ACTIVE'

  if (!tenantId || !name) {
    return { error: 'Tenant ID and Supplier Name are required' }
  }

  const { error: insertError } = await supabase.from('suppliers').insert({
    tenant_id: tenantId,
    name,
    phone,
    email,
    address,
    status
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/dashboard/suppliers')
  return { success: true }
}