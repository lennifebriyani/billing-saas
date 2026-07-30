import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/SidebarNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Cek User Session
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 2. Ambil Profil & Detail Tenant Toko
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, tenants(name, slug)')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.tenant_id) {
    redirect('/onboarding')
  }

  const tenant = profile?.tenants as unknown as { name: string; slug: string } | null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR NAVIGATION (LEFT) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 hidden md:flex">
        {/* Tenant Store Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            {tenant?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-semibold text-white text-sm truncate">
              {tenant?.name || 'Toko Utama'}
            </h2>
            <span className="text-xs text-slate-400 capitalize block truncate">
              Role: {profile.role || 'owner'}
            </span>
          </div>
        </div>

        {/* Dynamic Sidebar Nav */}
        <SidebarNav />

        {/* User Logged-in Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 truncate">
            {user.email}
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              {tenant?.name}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-600">
              Billing SaaS Layer 2
            </span>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
            </div>
            <div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}