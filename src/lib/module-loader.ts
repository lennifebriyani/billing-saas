import { createClient } from '@/lib/supabase/server'

export async function getTenantActiveModules(tenantId: string) {
  const supabase = await createClient()

  // 1. Ambil Business Type tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_type_id')
    .eq('id', tenantId)
    .single()

  if (!tenant || !tenant.business_type_id) {
    return []
  }

  // 2. Ambil Capabilities dari Business Type
  const { data: btCapabilities } = await supabase
    .from('business_type_capabilities')
    .select('capabilities(code)')
    .eq('business_type_id', tenant.business_type_id)

  const btCodes = btCapabilities?.map((m: any) => m.capabilities?.code).filter(Boolean) || []

  // 3. Ambil Capabilities dari Subscription Plan aktif
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .single()

  let planCodes: string[] = []
  if (subscription) {
    const { data: planCaps } = await supabase
      .from('plan_capabilities')
      .select('capabilities(code)')
      .eq('plan_id', subscription.plan_id)

    planCodes = planCaps?.map((m: any) => m.capabilities?.code).filter(Boolean) || []
  }

  // 4. Feature Flag Intersection (Harus didukung oleh Business Type DAN Subscription Plan)
  // Jika tenant tidak memiliki subscription aktif, fallback ke basic btCodes
  const allowedCapabilities = subscription 
    ? btCodes.filter((code: string) => planCodes.includes(code))
    : btCodes

  // 5. Load Module dari Registry berdasarkan Allowed Capabilities
  const { data: modules } = await supabase
    .from('modules')
    .select('*')

  if (!modules) return []

  return modules.filter((mod: any) => {
    if (mod.code === 'dashboard') return true
    return allowedCapabilities.includes(mod.capability_code)
  })
}