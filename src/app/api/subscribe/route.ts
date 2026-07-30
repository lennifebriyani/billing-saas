import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const planId = body.planId || "PLUS";
    const grossAmount = planId === "PLUS" ? 299000 : 149000;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isProduction = process.env.NODE_ENV === "production";
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = Buffer.from(`${serverKey}:`).toString("base64");
    const orderId = `SUB-${tenant.id.slice(0, 8)}-${Date.now()}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.email?.split("@")[0] || "Customer",
        email: user.email,
      },
      item_details: [
        {
          id: planId,
          price: grossAmount,
          quantity: 1,
          name: `Subscription SaaS Plan ${planId}`,
        },
      ],
    };

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_messages || "Midtrans error" }, { status: 400 });
    }

    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url, orderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}