import { login } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/30 sm:p-10">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold tracking-wide text-indigo-600">
            BILLING CONTROL
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Masuk ke dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Gunakan akun yang sudah terhubung dengan tenant Anda.
          </p>
        </div>

        {params.error ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {params.error}
          </div>
        ) : null}

        <form action={login} className="space-y-5">
          <input
            type="hidden"
            name="next"
            value={params.next ?? "/dashboard"}
          />

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@perusahaan.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Masukkan password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            Masuk
          </button>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-slate-500">
          Akses dan aktivitas akun dibatasi berdasarkan tenant.
        </p>
      </section>
    </main>
  );
}
