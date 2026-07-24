begin;

-- Supabase biasanya memasang extension di schema `extensions`.
create schema if not exists extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Helper RLS disimpan di schema yang tidak diekspos melalui Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  business_type text not null
    constraint tenants_business_type_check
    check (business_type in ('RENTAL', 'RETAIL')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete restrict,
  full_name text not null default '',
  role text not null default 'CASHIER'
    constraint profiles_role_check
    check (
      role in ('SUPER_ADMIN', 'TENANT_ADMIN', 'CASHIER', 'AUDITOR')
    ),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  -- Log dipertahankan walaupun user Auth dihapus.
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now(),
  constraint audit_logs_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create index if not exists profiles_tenant_id_idx
  on public.profiles (tenant_id);

create index if not exists audit_logs_tenant_created_at_idx
  on public.audit_logs (tenant_id, created_at desc);

create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id);

-- SECURITY DEFINER mencegah rekursi policy saat policy profiles perlu membaca
-- tenant_id user yang sedang login. search_path dikosongkan dan semua nama
-- object dibuat schema-qualified untuk mencegah search-path hijacking.
create or replace function private.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.tenant_id
  from public.profiles as p
  where p.id = (select auth.uid())
  limit 1
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
  limit 1
$$;

revoke all on function private.current_tenant_id() from public;
revoke all on function private.current_user_role() from public;
grant execute on function private.current_tenant_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Hapus policy bernama sama agar migration dapat dijalankan ulang dengan aman.
drop policy if exists tenants_select_same_tenant on public.tenants;
drop policy if exists tenants_update_same_tenant_admin on public.tenants;
drop policy if exists profiles_select_same_tenant on public.profiles;
drop policy if exists profiles_update_own_name on public.profiles;
drop policy if exists audit_logs_select_same_tenant on public.audit_logs;
drop policy if exists audit_logs_insert_same_tenant on public.audit_logs;

create policy tenants_select_same_tenant
on public.tenants
for select
to authenticated
using (
  id = (select private.current_tenant_id())
);

create policy tenants_update_same_tenant_admin
on public.tenants
for update
to authenticated
using (
  id = (select private.current_tenant_id())
  and (select private.current_user_role()) in ('SUPER_ADMIN', 'TENANT_ADMIN')
)
with check (
  id = (select private.current_tenant_id())
  and (select private.current_user_role()) in ('SUPER_ADMIN', 'TENANT_ADMIN')
);

create policy profiles_select_same_tenant
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or tenant_id = (select private.current_tenant_id())
);

create policy profiles_update_own_name
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
  and (
    tenant_id = (select private.current_tenant_id())
    or (
      tenant_id is null
      and (select private.current_tenant_id()) is null
    )
  )
);

create policy audit_logs_select_same_tenant
on public.audit_logs
for select
to authenticated
using (
  tenant_id = (select private.current_tenant_id())
  and (select private.current_user_role())
    in ('SUPER_ADMIN', 'TENANT_ADMIN', 'AUDITOR')
);

create policy audit_logs_insert_same_tenant
on public.audit_logs
for insert
to authenticated
with check (
  tenant_id = (select private.current_tenant_id())
  and user_id = (select auth.uid())
);

-- Jangan mengandalkan RLS saja untuk membatasi kolom sensitif.
revoke all on table public.tenants from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select on table public.tenants to authenticated;
grant update (name, slug, business_type)
  on table public.tenants to authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name)
  on table public.profiles to authenticated;

grant select, insert on table public.audit_logs to authenticated;

grant all on table public.tenants to service_role;
grant all on table public.profiles to service_role;
grant all on table public.audit_logs to service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_tenant_id uuid;
  requested_role text;
begin
  -- tenant_id dan role adalah data otorisasi. Ambil hanya dari app metadata,
  -- yang tidak dapat diubah sendiri oleh authenticated user.
  begin
    requested_tenant_id :=
      nullif(new.raw_app_meta_data ->> 'tenant_id', '')::uuid;
  exception
    when invalid_text_representation then
      requested_tenant_id := null;
  end;

  if requested_tenant_id is not null
     and not exists (
       select 1
       from public.tenants
       where id = requested_tenant_id
     ) then
    requested_tenant_id := null;
  end if;

  requested_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'role', ''),
    'CASHIER'
  );

  if requested_role not in (
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'CASHIER',
    'AUDITOR'
  ) then
    requested_role := 'CASHIER';
  end if;

  insert into public.profiles (
    id,
    tenant_id,
    full_name,
    role
  )
  values (
    new.id,
    requested_tenant_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

commit;
