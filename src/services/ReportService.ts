import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export class ReportService {
  
  // Profit & Loss Report
  static async getProfitLoss(tenantId: string, startDate: string, endDate: string) {
    const { data } = await supabase
      .from('journal_entries')
      .select(`
        debit, credit,
        accounts(type, account_categories(name))
      `)
      .eq('tenant_id', tenantId)
      .gte('journals.date', startDate)
      .lte('journals.date', endDate);

    // Filter logika: Revenue (Credit - Debit) - Expense (Debit - Credit)
    // Implementasi agregasi bisa dilakukan di sini atau via SQL View
    return { data }; 
  }

  // Financial Report: Balance Sheet (Simplified)
  static async getBalanceSheet(tenantId: string) {
    // Aggregasi data akun: Asset = Liability + Equity
    const { data } = await supabase
      .from('accounts')
      .select('name, type, journal_entries(debit, credit)')
      .eq('tenant_id', tenantId);
    
    return { data };
  }

  // Helper untuk Export CSV (Client-side use this data)
  static generateCSV(data: any[]) {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [header, ...rows].join('\n');
  }
}