import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('tenant_memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Active tenant context not found' }, { status: 400 });
    }

    const { data: sub, error } = await supabase
      .from('tenant_subscriptions')
      .upsert(
        {
          tenant_id: membership.tenant_id,
          plan_id: planId || 'CORE',
          status: 'TRIAL',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}