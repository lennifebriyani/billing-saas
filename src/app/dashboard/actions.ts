'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getClaims } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addProduct(formData: FormData) {
  const { tenantId } = await getClaims()

  if (!tenantId) {
    throw new Error('Unauthorized: Tenant ID tidak ditemukan!')
  }

  const name = formData.get('name') as string
  const price = Number(formData.get('price'))

  if (!name || isNaN(price)) {
    return
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // 1. Cek jumlah produk aktif tenant saat ini
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Gagal menghitung produk:', countError.message)
    return
  }

  // 2. Feature Gating: Batas Kuota Paket Free = 3 Produk
  const MAX_FREE_PRODUCTS = 3

  if (count !== null && count >= MAX_FREE_PRODUCTS) {
    // Redirect ke dashboard dengan status error limit
    redirect('/dashboard?error=limit_reached')
  }

  // 3. Insert Produk Baru jika kuota masih aman
  const { error } = await supabase.from('products').insert({
    tenant_id: tenantId,
    name,
    price,
  })

  if (error) {
    console.error('Gagal menambah produk:', error.message)
    return
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function deleteProduct(formData: FormData) {
  const { tenantId } = await getClaims()

  if (!tenantId) {
    throw new Error('Unauthorized!')
  }

  const productId = formData.get('id') as string

  if (!productId) return

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Gagal menghapus produk:', error.message)
    return
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// Tambahkan fungsi ini di baris paling bawah src/app/dashboard/actions.ts

export async function inviteMember(formData: FormData) {
  const email = formData.get('email') as string
  const role = (formData.get('role') as string) || 'member'

  if (!email) return

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // Panggil RPC Function yang sudah kita buat di Supabase
  const { error } = await supabase.rpc('invite_tenant_member', {
    user_email: email,
    new_role: role,
  })

  if (error) {
    console.error('Gagal mengundang member:', error.message)
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard?success=member_invited')
}

// Tambahkan di bagian bawah src/app/dashboard/actions.ts

export async function upgradePlan() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // Panggil RPC Function upgrade_tenant_plan
  const { error } = await supabase.rpc('upgrade_tenant_plan', {
    new_plan: 'pro',
  })

  if (error) {
    console.error('Gagal upgrade plan:', error.message)
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard?success=upgraded')
}