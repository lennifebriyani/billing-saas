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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, tenantId: null, role: null }
  }

  const appMetadata = session.user.app_metadata || {}
  
  return {
    user: session.user,
    tenantId: (appMetadata.tenant_id as string) || null,
    role: (appMetadata.role as string) || 'member',
  }
}