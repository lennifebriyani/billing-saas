import { createClient } from '@/utils/supabase/server';

export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  activeCustomers: number;
}

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // 1. Fetch total revenue & total transaksi dari tabel transactions
  const { data: transactionData, error: transError } = await supabase
    .from('transactions')
    .select('total_amount, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'COMPLETED');

  if (transError) {
    console.error('Error fetching transactions metrics:', transError.message);
    throw new Error('Gagal mengambil data transaksi tenant.');
  }

  const totalRevenue = transactionData?.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0) || 0;
  const totalTransactions = transactionData?.length || 0;

  // 2. Fetch total pelanggan aktif
  const { count: customerCount, error: customerError } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (customerError) {
    console.error('Error fetching customer count:', customerError.message);
    throw new Error('Gagal mengambil data pelanggan.');
  }

  return {
    totalRevenue,
    totalTransactions,
    activeCustomers: customerCount || 0,
  };
}