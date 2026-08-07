import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

export interface CreateJournalInput {
  tenantId: string;
  referenceNumber: string;
  date: string;
  description: string;
  sourceModule: 'POS' | 'PURCHASE' | 'PAYMENT' | 'EXPENSE';
  sourceId?: string;
  lines: JournalLineInput[];
}

export class FinancialDomainService {
  static async initializeDefaultAccounts(tenantId: string) {
    const { data: categories } = await supabase.from('account_categories').select('id, name');
    if (!categories) return;

    const catMap = new Map(categories.map(c => [c.name, c.id]));

    const defaultAccounts = [
      { code: '1110', name: 'Kas / Bank', type: 'Cash', cat: 'Asset', normal: 'DEBIT' },
      { code: '1120', name: 'Piutang Usaha', type: 'Accounts Receivable', cat: 'Asset', normal: 'DEBIT' },
      { code: '1130', name: 'Persediaan Barang (Inventory)', type: 'Inventory', cat: 'Asset', normal: 'DEBIT' },
      { code: '2110', name: 'Utang Usaha', type: 'Accounts Payable', cat: 'Liability', normal: 'CREDIT' },
      { code: '3110', name: 'Modal Pemilik', type: 'Equity', cat: 'Equity', normal: 'CREDIT' },
      { code: '4110', name: 'Pendapatan Penjualan (Revenue)', type: 'Sales Revenue', cat: 'Revenue', normal: 'CREDIT' },
      { code: '5110', name: 'Beban Operasional / Expense', type: 'Operating Expense', cat: 'Expense', normal: 'DEBIT' }
    ];

    for (const acc of defaultAccounts) {
      await supabase.from('accounts').upsert({
        tenant_id: tenantId,
        category_id: catMap.get(acc.cat),
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normal_balance: acc.normal
      }, { onConflict: 'tenant_id,code' });
    }
  }

  static async recordJournal(input: CreateJournalInput) {
    const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal unbalanced: Total Debit (${totalDebit}) must equal Total Credit (${totalCredit})`);
    }

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        tenant_id: input.tenantId,
        reference_number: input.referenceNumber,
        date: input.date,
        description: input.description,
        source_module: input.sourceModule,
        source_id: input.sourceId
      })
      .select()
      .single();

    if (journalError) throw journalError;

    const entries = input.lines.map(line => ({
      tenant_id: input.tenantId,
      journal_id: journal.id,
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit
    }));

    const { error: entriesError } = await supabase.from('journal_entries').insert(entries);
    if (entriesError) throw entriesError;

    return journal;
  }

  static async getDashboardMetrics(tenantId: string) {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select(`
        debit,
        credit,
        accounts:account_id (
          type,
          account_categories:category_id (name)
        )
      `)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    let totalRevenue = 0;
    let totalExpense = 0;
    let cashBalance = 0;

    entries?.forEach((entry: any) => {
      const categoryName = entry.accounts?.account_categories?.name;
      const accountType = entry.accounts?.type;

      if (categoryName === 'Revenue') {
        totalRevenue += (Number(entry.credit) - Number(entry.debit));
      } else if (categoryName === 'Expense') {
        totalExpense += (Number(entry.debit) - Number(entry.credit));
      } else if (accountType === 'Cash' || accountType === 'Bank') {
        cashBalance += (Number(entry.debit) - Number(entry.credit));
      }
    });

    const profit = totalRevenue - totalExpense;

    return {
      revenue: totalRevenue,
      expense: totalExpense,
      profit: profit,
      cashBalance: cashBalance
    };
  }
}