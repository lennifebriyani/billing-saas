-- 1. Platform Owners (Super Admin terpisah dari tenant)
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins full access" ON platform_admins;
CREATE POLICY "Platform admins full access" ON platform_admins
    FOR ALL USING (user_id IN (SELECT user_id FROM platform_admins));

-- 2. Subscription Engine (Plans, Subscriptions, Platform Invoices & Payments)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    billing_interval TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (billing_interval IN ('MONTHLY', 'YEARLY')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to plans" ON plans;
CREATE POLICY "Allow read access to plans" ON plans FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation policy for subscriptions" ON subscriptions;
CREATE POLICY "Tenant isolation policy for subscriptions" ON subscriptions
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS invoices_platform (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'VOID')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE invoices_platform ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation policy for invoices_platform" ON invoices_platform;
CREATE POLICY "Tenant isolation policy for invoices_platform" ON invoices_platform
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS payments_platform (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_platform_id UUID NOT NULL REFERENCES invoices_platform(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE payments_platform ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation policy for payments_platform" ON payments_platform;
CREATE POLICY "Tenant isolation policy for payments_platform" ON payments_platform
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- 3. Plan Capabilities (Feature Flag Mapping berdasarkan Plan)
CREATE TABLE IF NOT EXISTS plan_capabilities (
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, capability_id)
);

ALTER TABLE plan_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to plan_capabilities" ON plan_capabilities;
CREATE POLICY "Allow read access to plan_capabilities" ON plan_capabilities FOR SELECT USING (true);

-- 4. Module Registry
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    capability_code TEXT NOT NULL,
    path TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to modules" ON modules;
CREATE POLICY "Allow read access to modules" ON modules FOR SELECT USING (true);

-- 5. Audit Log Engine
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation policy for audit_logs" ON audit_logs;
CREATE POLICY "Tenant isolation policy for audit_logs" ON audit_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- 6. Notification Center
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User isolation policy for notifications" ON notifications;
CREATE POLICY "User isolation policy for notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- 7. Settings Engine (Platform, Tenant, User)
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation policy for tenant_settings" ON tenant_settings;
CREATE POLICY "Tenant isolation policy for tenant_settings" ON tenant_settings
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User isolation policy for user_settings" ON user_settings;
CREATE POLICY "User isolation policy for user_settings" ON user_settings
    FOR ALL USING (user_id = auth.uid());

-- 8. Seed Default Plans & Modules
INSERT INTO plans (name, code, price, billing_interval) VALUES
('Starter', 'starter', 99000, 'MONTHLY'),
('Professional', 'professional', 299000, 'MONTHLY'),
('Enterprise', 'enterprise', 799000, 'MONTHLY')
ON CONFLICT (code) DO NOTHING;

INSERT INTO modules (name, code, capability_code, path, icon) VALUES
('Dashboard', 'dashboard', 'reporting', '/dashboard', 'LayoutDashboard'),
('POS', 'pos', 'pos', '/dashboard/pos', 'ShoppingCart'),
('Inventory', 'inventory', 'inventory', '/dashboard/inventory', 'Package'),
('Purchases', 'purchases', 'purchase', '/dashboard/purchases', 'Truck'),
('Suppliers', 'suppliers', 'supplier-management', '/dashboard/suppliers', 'Users'),
('Customers', 'customers', 'customer-management', '/dashboard/customers', 'UserCheck'),
('Invoices & Payments', 'invoices', 'payment', '/dashboard/invoices', 'CreditCard')
ON CONFLICT (code) DO NOTHING;