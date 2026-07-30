'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-red-50 text-red-700 rounded-full mb-4">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan Sistem</h2>
      <p className="text-xs text-gray-500 max-w-md mb-6">
        Gagal memuat data dashboard. Silakan coba muat ulang halaman atau hubungi dukung teknis jika kendala berlanjut.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}