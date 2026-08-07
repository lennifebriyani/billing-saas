'use client';

export interface CartItem {
  itemId: string;      // <-- Pastikan itemId terdaftar di sini
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
}