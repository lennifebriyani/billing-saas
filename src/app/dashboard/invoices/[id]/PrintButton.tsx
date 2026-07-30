'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
    >
      🖨️ Cetak / Simpan PDF
    </button>
  )
}