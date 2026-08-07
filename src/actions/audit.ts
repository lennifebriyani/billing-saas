'use server'

import { createClient } from '@/lib/supabase/server'

interface LogAuditParams {
  tenantId: string
  action: string
  details?: Record<string, any>
}

export async function logAudit({ tenantId, action, details }: LogAuditParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: user?.id || null,
    action,
    details: details || {}
  })
}