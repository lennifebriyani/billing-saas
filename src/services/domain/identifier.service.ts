import { createClient } from '@/lib/supabase/server'

export class IdentifierDomainService {
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private static async getNextSequence(tenantId: string, documentType: 'INVOICE' | 'TRANSACTION' | 'PURCHASE' | 'CUSTOMER' | 'PRODUCT'): Promise<number> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_next_sequence', {
      p_tenant_id: tenantId,
      p_document_type: documentType,
    })

    if (error) {
      throw new Error(`Failed to generate sequence for ${documentType}: ${error.message}`)
    }

    return data as number
  }

  static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = await this.getNextSequence(tenantId, 'INVOICE')
    return `INV-${dateStr}-${String(seq).padStart(4, '0')}`
  }

  static async generateTransactionNumber(tenantId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = await this.getNextSequence(tenantId, 'TRANSACTION')
    return `TRX-${dateStr}-${String(seq).padStart(4, '0')}`
  }

  static async generatePurchaseNumber(tenantId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = await this.getNextSequence(tenantId, 'PURCHASE')
    return `PO-${dateStr}-${String(seq).padStart(4, '0')}`
  }

  static async generateCustomerCode(tenantId: string): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'CUSTOMER')
    return `CUST-${String(seq).padStart(4, '0')}`
  }

  static async generateProductSku(tenantId: string): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'PRODUCT')
    return `SKU-${String(seq).padStart(4, '0')}`
  }
}