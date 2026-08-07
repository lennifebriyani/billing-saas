import { createClient } from '@supabase/supabase-js';
import { FinancialDomainService } from './FinancialDomainService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class FinancialEventListener {
  static async handlePOSCompleted(tenantId: string, transactionId: string, refNumber: string, amount: number) {
    const accounts = await this.getTenantAccounts(tenantId);
    await FinancialDomainService.recordJournal({
      tenantId,
      referenceNumber: `J-POS-${refNumber}`,
      date: new Date().toISOString().split('T')[0],
      description: `Auto journal for POS transaction ${refNumber}`,
      sourceModule: 'POS',
      sourceId: transactionId,
      lines: [
        { accountId: accounts['1110'], debit: amount, credit: 0 },
        { accountId: accounts['4110'], debit: 0, credit: amount }
      ]
    });
  }

  static async handlePurchaseCompleted(tenantId: string, purchaseId: string, refNumber: string, amount: number, isCash: boolean) {
    const accounts = await this.getTenantAccounts(tenantId);
    await FinancialDomainService.recordJournal({
      tenantId,
      referenceNumber: `J-PUR-${refNumber}`,
      date: new Date().toISOString().split('T')[0],
      description: `Auto journal for Purchase ${refNumber}`,
      sourceModule: 'PURCHASE',
      sourceId: purchaseId,
      lines: [
        { accountId: accounts['1130'], debit: amount, credit: 0 },
        { accountId: isCash ? accounts['1110'] : accounts['2110'], debit: 0, credit: amount }
      ]
    });
  }

  static async handlePaymentCompleted(tenantId: string, paymentId: string, refNumber: string, amount: number) {
    const accounts = await this.getTenantAccounts(tenantId);
    await FinancialDomainService.recordJournal({
      tenantId,
      referenceNumber: `J-PAY-${refNumber}`,
      date: new Date().toISOString().split('T')[0],
      description: `Auto journal for Payment Invoice ${refNumber}`,
      sourceModule: 'PAYMENT',
      sourceId: paymentId,
      lines: [
        { accountId: accounts['1110'], debit: amount, credit: 0 },
        { accountId: accounts['1120'], debit: 0, credit: amount }
      ]
    });
  }

  static async handleExpenseRecorded(tenantId: string, expenseId: string, refNumber: string, amount: number) {
    const accounts = await this.getTenantAccounts(tenantId);
    await FinancialDomainService.recordJournal({
      tenantId,
      referenceNumber: `J-EXP-${refNumber}`,
      date: new Date().toISOString().split('T')[0],
      description: `Auto journal for Expense ${refNumber}`,
      sourceModule: 'EXPENSE',
      sourceId: expenseId,
      lines: [
        { accountId: accounts['5110'], debit: amount, credit: 0 },
        { accountId: accounts['1110'], debit: 0, credit: amount }
      ]
    });
  }

  private static async getTenantAccounts(tenantId: string) {
    const { data } = await supabase.from('accounts').select('id, code').eq('tenant_id', tenantId);
    const map: Record<string, string> = {};
    data?.forEach(acc => { map[acc.code] = acc.id; });
    return map;
  }
}