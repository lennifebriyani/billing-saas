-- 1. Tabel Business Types
CREATE TABLE IF NOT EXISTS business_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_types_code ON business_types(code);
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to business_types" ON business_types;
CREATE POLICY "Allow read access to business_types" ON business_types FOR SELECT USING (true);

-- 2. Tabel Capabilities
CREATE TABLE IF NOT EXISTS capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_capabilities_code ON capabilities(code);
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to capabilities" ON capabilities;
CREATE POLICY "Allow read access to capabilities" ON capabilities FOR SELECT USING (true);

-- 3. Tabel Business Type Capabilities (Mapping)
CREATE TABLE IF NOT EXISTS business_type_capabilities (
    business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (business_type_id, capability_id)
);

ALTER TABLE business_type_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to business_type_capabilities" ON business_type_capabilities;
CREATE POLICY "Allow read access to business_type_capabilities" ON business_type_capabilities FOR SELECT USING (true);

-- 4. Tambahkan business_type_id ke tabel tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id);
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type_id);

-- 5. Seed Data Business Types
INSERT INTO business_types (name, code, description) VALUES
('Retail', 'retail', 'General retail store'),
('Minimarket', 'minimarket', 'Mini grocery and convenience store'),
('Cafe', 'cafe', 'Coffee shop and beverage outlet'),
('Restaurant', 'restaurant', 'Dining restaurant and eatery'),
('Laundry', 'laundry', 'Laundry and dry cleaning service'),
('Rental PS', 'rental-ps', 'PlayStation game rental console'),
('Warnet', 'warnet', 'Internet cafe and gaming center'),
('Hotel', 'hotel', 'Hospitality and lodging accommodation'),
('Klinik', 'klinik', 'Medical clinic and healthcare service'),
('Bengkel', 'bengkel', 'Automotive repair and workshop'),
('Salon', 'salon', 'Hair and beauty salon'),
('Barbershop', 'barbershop', 'Men grooming and barbershop'),
('Construction', 'construction', 'Construction contractor and services'),
('Education', 'education', 'School, course, and training center'),
('Professional Service', 'professional-service', 'Consulting, agency, and professional services')
ON CONFLICT (code) DO NOTHING;

-- 6. Seed Data Capabilities
INSERT INTO capabilities (name, code, description) VALUES
('Sell Goods', 'sell-goods', 'Ability to sell physical products'),
('Sell Service', 'sell-service', 'Ability to sell services'),
('Inventory', 'inventory', 'Stock and inventory tracking'),
('Purchase', 'purchase', 'Purchase orders and supplier restocking'),
('POS', 'pos', 'Point of Sales cashier interface'),
('Time Billing', 'time-billing', 'Billing based on duration/time'),
('Booking', 'booking', 'Resource or service booking'),
('Reservation', 'reservation', 'Room or table reservation'),
('Appointment', 'appointment', 'Schedule appointments'),
('Membership', 'membership', 'Customer membership tiers'),
('Subscription', 'subscription', 'Recurring subscription billing'),
('Customer Management', 'customer-management', 'Manage customer directory and history'),
('Supplier Management', 'supplier-management', 'Manage suppliers and vendors'),
('Reporting', 'reporting', 'Business analytics and reports'),
('Expense Management', 'expense-management', 'Track operational expenses'),
('Payment', 'payment', 'Payment processing and invoice settlement')
ON CONFLICT (code) DO NOTHING;

-- 7. Seed Mapping Default (Contoh: Retail, Laundry, Rental PS, Hotel)
DO $$
DECLARE
    v_retail_id UUID;
    v_laundry_id UUID;
    v_rental_id UUID;
    v_hotel_id UUID;
    
    v_cap_sell_goods UUID;
    v_cap_sell_service UUID;
    v_cap_inventory UUID;
    v_cap_purchase UUID;
    v_cap_pos UUID;
    v_cap_time_billing UUID;
    v_cap_reservation UUID;
    v_cap_customer UUID;
    v_cap_supplier UUID;
    v_cap_reporting UUID;
    v_cap_payment UUID;
BEGIN
    SELECT id INTO v_retail_id FROM business_types WHERE code = 'retail';
    SELECT id INTO v_laundry_id FROM business_types WHERE code = 'laundry';
    SELECT id INTO v_rental_id FROM business_types WHERE code = 'rental-ps';
    SELECT id INTO v_hotel_id FROM business_types WHERE code = 'hotel';

    SELECT id INTO v_cap_sell_goods FROM capabilities WHERE code = 'sell-goods';
    SELECT id INTO v_cap_sell_service FROM capabilities WHERE code = 'sell-service';
    SELECT id INTO v_cap_inventory FROM capabilities WHERE code = 'inventory';
    SELECT id INTO v_cap_purchase FROM capabilities WHERE code = 'purchase';
    SELECT id INTO v_cap_pos FROM capabilities WHERE code = 'pos';
    SELECT id INTO v_cap_time_billing FROM capabilities WHERE code = 'time-billing';
    SELECT id INTO v_cap_reservation FROM capabilities WHERE code = 'reservation';
    SELECT id INTO v_cap_customer FROM capabilities WHERE code = 'customer-management';
    SELECT id INTO v_cap_supplier FROM capabilities WHERE code = 'supplier-management';
    SELECT id INTO v_cap_reporting FROM capabilities WHERE code = 'reporting';
    SELECT id INTO v_cap_payment FROM capabilities WHERE code = 'payment';

    -- Retail Mappings
    INSERT INTO business_type_capabilities (business_type_id, capability_id) VALUES
    (v_retail_id, v_cap_sell_goods), (v_retail_id, v_cap_inventory), (v_retail_id, v_cap_purchase),
    (v_retail_id, v_cap_pos), (v_retail_id, v_cap_customer), (v_retail_id, v_cap_supplier),
    (v_retail_id, v_cap_reporting), (v_retail_id, v_cap_payment)
    ON CONFLICT DO NOTHING;

    -- Laundry Mappings
    INSERT INTO business_type_capabilities (business_type_id, capability_id) VALUES
    (v_laundry_id, v_cap_sell_service), (v_laundry_id, v_cap_inventory), (v_laundry_id, v_cap_pos),
    (v_laundry_id, v_cap_customer), (v_laundry_id, v_cap_reporting), (v_laundry_id, v_cap_payment)
    ON CONFLICT DO NOTHING;

    -- Rental PS Mappings
    INSERT INTO business_type_capabilities (business_type_id, capability_id) VALUES
    (v_rental_id, v_cap_time_billing), (v_rental_id, v_cap_pos), (v_rental_id, v_cap_inventory),
    (v_rental_id, v_cap_customer), (v_rental_id, v_cap_reporting), (v_rental_id, v_cap_payment)
    ON CONFLICT DO NOTHING;

    -- Hotel Mappings
    INSERT INTO business_type_capabilities (business_type_id, capability_id) VALUES
    (v_hotel_id, v_cap_reservation), (v_hotel_id, v_cap_payment), (v_hotel_id, v_cap_customer),
    (v_hotel_id, v_cap_reporting)
    ON CONFLICT DO NOTHING;
END $$;