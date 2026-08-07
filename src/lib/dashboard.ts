import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  activeCustomers: number;
}

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // 1. Fetch total revenue DARI INVOICES yang sudah DIBAYAR (PAID)
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .select('grand_total')
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'PAID');

  if (invoiceError) {
    console.error('Error fetching invoice metrics:', invoiceError.message);
  }
  
  const totalRevenue = invoiceData?.reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0) || 0;

  // 2. Fetch total transaksi dari transactions
  const { count: totalTransactions, error: transError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'COMPLETED');

  // 3. Fetch total pelanggan aktif
  const { count: activeCustomers, error: customerError } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return {
    totalRevenue,
    totalTransactions: totalTransactions || 0,
    activeCustomers: activeCustomers || 0,
  };
}