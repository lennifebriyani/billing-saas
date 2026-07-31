import crypto from 'crypto'

export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || ''
export const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
export const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

export const MIDTRANS_SNAP_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

/**
 * Verifikasi SHA-512 Signature dari Webhook Midtrans
 * Format formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureHeader: string
): boolean {
  if (!MIDTRANS_SERVER_KEY) return false

  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY
  const hash = crypto.createHash('sha512').update(payload).digest('hex')
  return hash === signatureHeader
}