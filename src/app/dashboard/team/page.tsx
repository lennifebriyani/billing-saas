import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { addTeamMember } from './actions';

export const revalidate = 0;

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentMember } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentMember || currentMember.role !== 'OWNER') {
    redirect('/dashboard');
  }

  const { data: members } = await supabase
    .from('tenant_memberships')
    .select('id, user_id, role, created_at')
    .eq('tenant_id', currentMember.tenant_id);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight border-b pb-4">
        Kelola Tim & Hak Akses
      </h1>

      {/* Form Tambah Anggota */}
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-base font-semibold">Tambah Anggota Tim (Kasir / Staf)</h2>
        <form action={addTeamMember} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            name="userId"
            required
            placeholder="User UUID Supabase"
            className="p-2 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-black"
          />
          <select name="role" className="p-2 border rounded text-xs">
            <option value="CASHIER">CASHIER (Kasir)</option>
            <option value="OWNER">OWNER (Pemilik)</option>
          </select>
          <button
            type="submit"
            className="py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
          >
            + Tambah Anggota
          </button>
        </form>
      </div>

      {/* Daftar Anggota */}
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
        <h2 className="text-base font-semibold">Daftar Anggota Saat Ini</h2>
        <div className="divide-y">
          {members?.map((m) => (
            <div key={m.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <div className="font-mono font-medium">{m.user_id}</div>
                <div className="text-gray-400">
                  Bergabung: {new Date(m.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded font-bold ${
                  m.role === 'OWNER'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}