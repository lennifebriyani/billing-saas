-- ==========================================
-- 1. FONDASI MULTI-TENANT & USER MANAGEMENT
-- ==========================================

-- Tabel Tenant (Pemilik Usaha / Entitas Usaha)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Relasi User ke Tenant (Siapa bekerja di mana dan role-nya apa)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Helper Function untuk Mengambil Tenant ID dari User yang Sedang Login
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==========================================
-- 2. DOMAIN CORE POS / BILLING BISNIS
-- ==========================================

-- Tabel Customer milik Tenant
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Produk / Layanan milik Tenant
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Transaksi Penjualan
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT CHECK (status IN ('pending', 'completed', 'canceled')) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Detail Item Transaksi
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ==========================================
-- 3. DOMAIN PAYMENT ENGINE (PEMBAYARAN CUSTOMER)
-- ==========================================

-- Upaya Pembayaran (Payment Attempt)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  method TEXT CHECK (method IN ('cash', 'manual_transfer', 'qris_gateway')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'successful', 'failed', 'refunded')) DEFAULT 'pending',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log Perubahan Status Pembayaran & Webhook
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id UUID REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. DOMAIN SAAS SUBSCRIPTION (TENANT KE PLATFORM)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  features JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saas_plans(id),
  status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'suspended')) DEFAULT 'trial',
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. ROW LEVEL SECURITY (ISOLASI DATA TENANT)
-- ==========================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Policy Customers
CREATE POLICY "Tenant Customers Isolation Policy" ON public.customers
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Policy Products
CREATE POLICY "Tenant Products Isolation Policy" ON public.products
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Policy Transactions
CREATE POLICY "Tenant Transactions Isolation Policy" ON public.transactions
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Policy Transaction Items
CREATE POLICY "Tenant Transaction Items Isolation Policy" ON public.transaction_items
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Policy Payment Attempts
CREATE POLICY "Tenant Payment Attempts Isolation Policy" ON public.payment_attempts
  FOR ALL USING (tenant_id = public.get_current_tenant_id());