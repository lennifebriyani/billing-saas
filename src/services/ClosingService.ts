import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export class ClosingService {
  static async openShift(tenantId: string, userId: string, openingBalance: number) {
    return await supabase.from('daily_closings').insert({
      tenant_id: tenantId,
      user_id: userId,
      opening_balance: openingBalance,
      status: 'OPEN'
    });
  }

  static async closeShift(closingId: string, actualCash: number) {
    // 1. Ambil data shift
    const { data: shift } = await supabase.from('daily_closings').select('*').eq('id', closingId).single();
    
    // 2. Hitung selisih
    const difference = actualCash - shift.closing_balance;

    // 3. Update status
    return await supabase.from('daily_closings').update({
      actual_cash: actualCash,
      difference: difference,
      status: 'CLOSED',
      closed_at: new Date().toISOString()
    }).eq('id', closingId);
  }
}