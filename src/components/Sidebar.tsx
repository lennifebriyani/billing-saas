import Link from 'next/link'
import { getTenantActiveModules } from '@/lib/module-loader'

interface SidebarProps {
  tenantId: string
}

export async function Sidebar({ tenantId }: SidebarProps) {
  const activeModules = await getTenantActiveModules(tenantId)

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen p-4">
      <div className="text-xl font-bold mb-8 px-2">Lumina SaaS</div>
      <nav className="flex flex-col gap-2 flex-1">
        {activeModules.map((mod: any) => (
          <Link
            key={mod.code}
            href={mod.path}
            className="px-3 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-medium"
          >
            {mod.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}