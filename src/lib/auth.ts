import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getClaims() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, tenantId: null, role: null, plan: 'free' }
  }

  const appMetadata = user.app_metadata || {}
  const tenantId = appMetadata.tenant_id as string | undefined
  const role = appMetadata.role as string | undefined
  const plan = (appMetadata.plan as string | undefined) || 'free'

  return {
    user,
    tenantId,
    role,
    plan,
  }
}