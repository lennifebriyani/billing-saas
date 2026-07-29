"use client";

import { useState } from "react";

declare global {
  interface Window {
    snap?: any;
  }
}

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      // Cek apakah server mengembalikan error
      if (!res.ok || !data.token) {
        throw new Error(data.message || "Gagal mendapatkan token pembayaran.");
      }

      // Jika dalam Mode Testing / Dummy (Server Key belum dipasang di .env.local)
      if (data.isMock) {
        alert(
          "⚠️ [MODE TESTING / DEMO]\n\n" +
          "Tombol berfungsi dengan baik!\n" +
          "Server Key Midtrans belum diisi di .env.local, tetapi sistem menggunakan Token Simulasi (" + data.token + ")."
        );
        return;
      }

      // Jika menggunakan Midtrans Asli
      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: function () {
            alert("Pembayaran berhasil!");
            window.location.reload();
          },
          onPending: function () {
            alert("Menunggu pembayaran diselesaikan.");
          },
          onError: function () {
            alert("Pembayaran gagal!");
          },
          onClose: function () {
            alert("Popup pembayaran ditutup.");
          },
        });
      } else {
        alert("Script Midtrans Snap SDK belum dimuat pada layout.tsx.");
      }
    } catch (error: any) {
      alert(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
    >
      {loading ? "Memproses..." : "Berlangganan Sekarang"}
    </button>
  );
}