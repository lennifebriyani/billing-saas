'use client';

import { CartItem } from './actions';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  cart,
  totalAmount,
  amountPaid,
  paymentMethod,
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const change = amountPaid - totalAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4 print:p-0 print:shadow-none">
        {/* Tampilan Struk */}
        <div className="text-center border-b pb-3 font-mono text-xs space-y-1">
          <h3 className="text-base font-bold">NOTA TRANSAKSI</h3>
          <p className="text-gray-500">{new Date().toLocaleString('id-ID')}</p>
        </div>

        <div className="font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.itemId} className="flex justify-between">
              <div>
                <div>{item.name}</div>
                <div className="text-gray-400">
                  {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="font-semibold">
                Rp {(item.quantity * item.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-3 font-mono text-xs space-y-1">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Metode:</span>
            <span>{paymentMethod}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Bayar:</span>
            <span>Rp {amountPaid.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Kembali:</span>
            <span>Rp {change > 0 ? change.toLocaleString('id-ID') : 0}</span>
          </div>
        </div>

        {/* Tombol Aksi (Sembunyi saat dicetak) */}
        <div className="flex space-x-2 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
          >
            🖨️ Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border text-xs font-semibold rounded hover:bg-gray-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}