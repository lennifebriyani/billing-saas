import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Cek User Logged In
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Sesi login berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    // 2. Cek Tenant
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json(
        { message: "Data toko/tenant tidak ditemukan." },
        { status: 400 }
      );
    }

    // 3. Ambil Key & Status Production dari .env.local
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json(
        { message: "MIDTRANS_SERVER_KEY belum dikonfigurasi." },
        { status: 500 }
      );
    }

    // 4. Penentuan Endpoint URL berdasarkan mode (Sandbox vs Production)
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = Buffer.from(`${serverKey}:`).toString("base64");
    const orderId = `SUB-${tenant.id.slice(0, 8)}-${Date.now()}`;

    // 5. Request Token ke Midtrans
    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: 150000, // Nominal pembayaran
        },
        customer_details: {
          first_name: tenant.name,
          email: user.email,
        },
      }),
    });

    const midtransData = await response.json();

    if (!response.ok || !midtransData.token) {
      const errorMsg =
        midtransData.error_messages?.join(", ") ||
        midtransData.message ||
        "Gagal mendapatkan token transaksi dari Midtrans.";
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    return NextResponse.json({ token: midtransData.token });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan server internal" },
      { status: 500 }
    );
  }
}