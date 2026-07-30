-- ==============================================================================
-- PHASE 0 CANONICAL SCHEMA MIGRATION
-- Project: Multi-Tenant SaaS Billing & POS
-- Description: Unifies database schema, enforces RLS, & secures atomic money/stock operations.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'GENERAL', -- RETAIL, FNB, RENTAL, APPOINTMENT, GENERAL
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TENANT MEMBERSHIPS (Multi-tenant Auth & Role Bridge)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'STAFF', -- OWNER, ADMIN, MANAGER, CASHIER, FINANCE, AUDITOR
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);

-- Helper Function: Get Current User Active Tenant ID
CREATE OR REPLACE FUNCTION public.get_active_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM public.tenant_memberships 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);

-- 4. CATALOG ITEMS (Replaces legacy 'products' table)
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    type TEXT NOT NULL DEFAULT 'PRODUCT', -- PRODUCT, SERVICE
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_tenant ON public.catalog_items(tenant_id);

-- 5. TRANSACTIONS (Replaces legacy 'orders' table)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, CANCELLED
    payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIALLY_PAID, PAID
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.transactions(tenant_id);

-- 6. TRANSACTION ITEMS (Replaces legacy 'order_items' table)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_items(id),
    item_name TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tenant ON public.transaction_items(tenant_id);

-- 7. CUSTOMER PAYMENTS
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL DEFAULT 'CASH', -- CASH, MANUAL_TRANSFER, QRIS
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_payments_tenant ON public.customer_payments(tenant_id);

-- 8. TENANT SUBSCRIPTIONS (Replaces legacy 'subscriptions' table)
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'CORE', -- CORE, PLUS
    status TEXT NOT NULL DEFAULT 'TRIAL', -- TRIAL, ACTIVE, PAST_DUE, CANCELLED
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);

-- 9. AUDIT LOGS (Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Generic Isolation Policy Macro
CREATE POLICY "Tenant Isolation: catalog_items" ON public.catalog_items
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: customers" ON public.customers
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: transactions" ON public.transactions
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: transaction_items" ON public.transaction_items
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: customer_payments" ON public.customer_payments
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: tenant_subscriptions" ON public.tenant_subscriptions
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Isolation: audit_logs" ON public.audit_logs
    FOR ALL USING (tenant_id = public.get_active_tenant_id());

CREATE POLICY "Tenant Membership View Self" ON public.tenant_memberships
    FOR SELECT USING (user_id = auth.uid());

-- ==============================================================================
-- ATOMIC TRANSACTION PROCEDURE (SEALS MONEY & STOCK LOGIC SERVER-SIDE)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
    p_customer_id UUID,
    p_items JSONB, -- Array of { item_id: UUID, quantity: INT }
    p_payment_method TEXT,
    p_amount_paid NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_transaction_id UUID;
    v_tx_number TEXT;
    v_item RECORD;
    v_db_item RECORD;
    v_calculated_subtotal NUMERIC(12,2) := 0;
    v_item_subtotal NUMERIC(12,2);
BEGIN
    v_user_id := auth.uid();
    v_tenant_id := public.get_active_tenant_id();

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Active tenant not found for current user.';
    END IF;

    v_tx_number := 'TX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);

    -- 1. Create Transaction Shell
    INSERT INTO public.transactions (
        tenant_id, transaction_number, customer_id, user_id, status, payment_status, subtotal, tax, discount, total
    ) VALUES (
        v_tenant_id, v_tx_number, p_customer_id, v_user_id, 'COMPLETED', 'PENDING', 0, 0, 0, 0
    ) RETURNING id INTO v_transaction_id;

    -- 2. Process Items, Validate Stock, & Calculate Real Total Server-Side
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(item_id UUID, quantity INT)
    LOOP
        -- Lock row for update to prevent concurrent race condition (oversell)
        SELECT id, name, price, stock 
        INTO v_db_item 
        FROM public.catalog_items 
        WHERE id = v_item.item_id AND tenant_id = v_tenant_id
        FOR UPDATE;

        IF v_db_item.id IS NULL THEN
            RAISE EXCEPTION 'Catalog item % not found for this tenant.', v_item.item_id;
        END IF;

        IF v_db_item.stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insufficient for item %. Requested: %, Available: %', v_db_item.name, v_item.quantity, v_db_item.stock;
        END IF;

        v_item_subtotal := v_db_item.price * v_item.quantity;
        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;

        -- Insert item snapshot
        INSERT INTO public.transaction_items (
            tenant_id, transaction_id, item_id, item_name, unit_price, quantity, subtotal
        ) VALUES (
            v_tenant_id, v_transaction_id, v_db_item.id, v_db_item.name, v_db_item.price, v_item.quantity, v_item_subtotal
        );

        -- Deduct stock
        UPDATE public.catalog_items 
        SET stock = stock - v_item.quantity, updated_at = NOW()
        WHERE id = v_db_item.id;
    END LOOP;

    -- Update Transaction Totals
    UPDATE public.transactions 
    SET subtotal = v_calculated_subtotal, 
        total = v_calculated_subtotal,
        payment_status = CASE WHEN p_amount_paid >= v_calculated_subtotal THEN 'PAID' ELSE 'PARTIALLY_PAID' END
    WHERE id = v_transaction_id;

    -- Record Payment
    IF p_amount_paid > 0 THEN
        INSERT INTO public.customer_payments (
            tenant_id, transaction_id, payment_method, amount
        ) VALUES (
            v_tenant_id, v_transaction_id, p_payment_method, p_amount_paid
        );
    END IF;

    -- Record Audit Log
    INSERT INTO public.audit_logs (tenant_id, user_id, action, entity, details)
    VALUES (v_tenant_id, v_user_id, 'CREATE_TRANSACTION', 'TRANSACTION', jsonb_build_object('transaction_id', v_transaction_id, 'total', v_calculated_subtotal));

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'transaction_number', v_tx_number,
        'total', v_calculated_subtotal
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;