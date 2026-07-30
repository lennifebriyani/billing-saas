import { createTenantOnboarding } from './actions';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Setup Usaha Anda
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Masukkan nama bisnis/toko untuk mulai menggunakan Billing SaaS.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 border border-gray-100">
          <form action={createTenantOnboarding} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Toko / Perusahaan
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Contoh: Toko Kopi Sejahtera"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none transition"
              >
                Buat Toko & Lanjutkan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}