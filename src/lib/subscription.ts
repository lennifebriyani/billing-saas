import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export interface TenantSubscription {
  id: string
  tenantId: string
  planType: 'core' | 'plus'
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled'
  trialEndsAt: Date | null
  currentPeriodEndsAt: Date | null
}

export async function getTenantSubscription(): Promise<TenantSubscription | null> {
  const supabase = await createClient()
  const tenant = await getCurrentTenant()

  if (!tenant) return null

  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  if (error || !data) {
    // Default fallback ke status Trial jika data belum ada
    return {
      id: 'demo-sub',
      tenantId: tenant.id,
      planType: 'core',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari
      currentPeriodEndsAt: null,
    }
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    planType: data.plan_type,
    status: data.status,
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
    currentPeriodEndsAt: data.current_period_ends_at ? new Date(data.current_period_ends_at) : null,
  }
}