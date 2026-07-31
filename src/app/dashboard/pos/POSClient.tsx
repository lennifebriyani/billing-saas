'use client'

import { useState, useEffect } from 'react'
import { getActiveProducts, createOrder, createMidtransSnapToken, CartItem } from './actions'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
}

export default function POSClient({ initialProducts }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(!initialProducts)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash')

  useEffect(() => {
    if (!initialProducts) {
      async function loadCatalog() {
        setLoading(true)
        const data = await getActiveProducts()
        setProducts(data)
        setLoading(false)
      }
      loadCatalog()
    }
  }, [initialProducts])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok ${product.name} tidak mencukupi (sisa ${product.stock})`)
          return prev
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          itemId: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    })
  }

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta
            if (newQty > maxStock) {
              alert(`Stok maksimal hanya ${maxStock}`)
              return item
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setSubmitting(true)

    try {
      const res = await createOrder(cart, paymentMethod)
      if (res.error || !res.orderId) {
        alert(res.error || 'Gagal memproses transaksi.')
        setSubmitting(false)
        return
      }

      if (paymentMethod === 'qris') {
        const snapRes = await createMidtransSnapToken(res.orderId)
        if (snapRes.error) {
          alert(`Order dibuat, namun Midtrans error: ${snapRes.error}`)
        } else if (snapRes.redirectUrl) {
          window.open(snapRes.redirectUrl, '_blank')
        }
      }

      alert('Transaksi berhasil!')
      setCart([])
      const updatedProducts = await getActiveProducts()
      setProducts(updatedProducts)
    } catch (err: any) {
      console.error(err)
      alert('Terjadi kesalahan saat memproses checkout.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Memuat katalog produk...</div>
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Katalog Produk */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Mesin Kasir (POS)</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-4 border rounded-lg bg-white shadow-sm hover:border-blue-500 cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-xs text-gray-500">Stok: {product.stock}</p>
              </div>
              <p className="mt-3 text-sm font-bold text-blue-600">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">
              Belum ada produk aktif yang tersedia.
            </p>
          )}
        </div>
      </div>

      {/* Keranjang & Checkout */}
      <div className="border rounded-lg bg-white p-4 shadow-sm flex flex-col justify-between h-[calc(100vh-120px)]">
        <div>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Keranjang Belanja</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Keranjang kosong</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const catalogProd = products.find((p) => p.id === item.productId)
                const maxStock = catalogProd ? catalogProd.stock : 999

                return (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center text-sm border-b pb-2"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1, maxStock)}
                        className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1, maxStock)}
                        className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 text-xs ml-2 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail Pembayaran */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center text-base font-bold">
            <span>Total:</span>
            <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 text-xs font-semibold rounded border ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 text-xs font-semibold rounded border ${
                  paymentMethod === 'qris'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                QRIS / Midtrans
              </button>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Memproses...' : 'Selesaikan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  )
}