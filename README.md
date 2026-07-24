# Modul 1 — Supabase Multi-Tenant Auth & RLS

Bundle ini berisi migrasi database Supabase, isolasi tenant menggunakan Row
Level Security (RLS), integrasi Supabase SSR untuk Next.js App Router, halaman
login, proteksi route dashboard, serta dashboard uji.

## Prasyarat

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase project
- Node.js sesuai versi Next.js yang digunakan

Pasang dependensi:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Instalasi

1. Jalankan
   `supabase/migrations/202607240001_module_1_auth_rls.sql` melalui Supabase SQL
   Editor atau Supabase CLI.
2. Salin seluruh isi folder `src/` ke folder `src/` proyek Next.js.
3. Salin `.env.local.example` menjadi `.env.local`, lalu isi URL dan anon key
   Supabase.
4. Restart development server setelah mengubah environment variable.
5. Buat tenant dan user melalui alur provisioning tepercaya. Halaman dalam
   bundle ini hanya menyediakan login, bukan pendaftaran tenant publik.

## Provisioning tenant dan user

Migrasi sengaja membaca `tenant_id` dan `role` hanya dari `raw_app_meta_data`,
bukan `raw_user_meta_data`. User dapat mengubah user metadata miliknya sendiri,
sehingga user metadata tidak aman untuk data otorisasi.

Contoh membuat tenant:

```sql
insert into public.tenants (name, slug, business_type)
values ('Toko Contoh', 'toko-contoh', 'RETAIL')
returning id;
```

User baru yang belum memiliki app metadata tetap mendapat profile, tetapi
`tenant_id` bernilai `NULL` dan tidak memperoleh akses data tenant. Assign tenant
melalui backend/admin yang memakai service-role key atau dari SQL Editor:

```sql
update public.profiles
set
  tenant_id = 'UUID_TENANT',
  role = 'TENANT_ADMIN',
  full_name = 'Nama Admin'
where id = 'UUID_AUTH_USER';
```

Jangan pernah menaruh service-role key di environment variable berawalan
`NEXT_PUBLIC_` atau mengirimkannya ke browser.

## Model keamanan yang diterapkan

- Semua tabel mengaktifkan RLS.
- User hanya dapat melihat tenant yang sama dengan profile-nya.
- `SUPER_ADMIN` dalam modul ini tetap tenant-scoped agar tidak melanggar
  isolasi antar tenant.
- `TENANT_ADMIN` dan `SUPER_ADMIN` dapat mengubah atribut tenant mereka sendiri.
- User hanya dapat mengubah `full_name` profile miliknya. `tenant_id` dan `role`
  tidak dapat diubah melalui client authenticated biasa.
- Audit log dapat ditambahkan untuk user yang sedang login dan tenant-nya
  sendiri, tetapi tidak dapat diubah atau dihapus melalui client biasa.
- Pembacaan audit log dibatasi untuk `AUDITOR`, `TENANT_ADMIN`, dan
  `SUPER_ADMIN` pada tenant yang sama.

Jika aplikasi membutuhkan platform admin lintas tenant, buat jalur admin
server-only terpisah dengan service-role key dan audit ketat. Jangan menambahkan
pengecualian lintas tenant ke policy client biasa.

## Next.js 16+

Next.js 16 mengganti nama konvensi `middleware.ts` menjadi `proxy.ts`. Bundle
utama tetap menyediakan `src/middleware.ts` sesuai kebutuhan modul dan cocok
untuk Next.js 15 ke bawah.

Untuk Next.js 16+, hapus/rename `src/middleware.ts`, lalu gunakan isi
`variants/next-16/src/proxy.ts`. Jangan mengaktifkan kedua file sekaligus.

## Pengujian minimum

1. Buat Tenant A dan Tenant B.
2. Buat minimal satu user untuk masing-masing tenant.
3. Login sebagai user Tenant A dan pastikan hanya Tenant A yang muncul.
4. Dari browser client Tenant A, coba membaca Tenant B berdasarkan UUID-nya;
   hasil harus kosong.
5. Coba memasukkan audit log dengan `tenant_id` Tenant B; operasi harus ditolak
   oleh RLS.
6. Coba mengubah `role` atau `tenant_id` profile melalui browser client; operasi
   harus ditolak oleh column privilege.
7. Logout lalu buka `/dashboard`; browser harus diarahkan ke `/login`.
