import { createClient } from '@/lib/supabase/server'

export async function getTenantCapabilities(tenantId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('business_type_id')
    .eq('id', tenantId)
    .single()

  if (tenantErr || !tenant || !tenant.business_type_id) {
    // Fallback default capabilities jika tenant belum memiliki tipe bisnis (misal: data legacy)
    return [
      'pos', 'inventory', 'purchase', 'customer-management', 
      'supplier-management', 'payment', 'reporting', 'sell-goods'
    ]
  }

  const { data: mappings, error: mapErr } = await supabase
    .from('business_type_capabilities')
    .select('capabilities(code)')
    .eq('business_type_id', tenant.business_type_id)

  if (mapErr || !mappings) {
    return []
  }

  return mappings
    .map((m: any) => m.capabilities?.code)
    .filter((code: string): code is string => Boolean(code))
}