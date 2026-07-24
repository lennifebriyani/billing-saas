"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function safeInternalPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/dashboard";
  }

  return value;
}

function loginErrorUrl(nextPath: string) {
  const searchParams = new URLSearchParams({
    error: "Email atau password tidak valid.",
    next: nextPath,
  });

  return `/login?${searchParams.toString()}`;
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const nextPath = safeInternalPath(formData.get("next"));

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    redirect(loginErrorUrl(nextPath));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    redirect(loginErrorUrl(nextPath));
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
