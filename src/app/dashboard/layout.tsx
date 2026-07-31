import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // 1. Cek User Login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Cek apakah user punya setidaknya 1 toko di tenant_users
  const { data: tenantUsers, error } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)

  // Jika tidak punya toko sama sekali DAN tidak ada error, baru redirect ke onboarding
  if (!error && (!tenantUsers || tenantUsers.length === 0)) {
    redirect('/onboarding')
  }

  return <>{children}</>
}