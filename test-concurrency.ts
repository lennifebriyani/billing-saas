import { IdentifierDomainService } from './src/services/domain/identifier.service'

async function runConcurrencyTest() {
  const tenantId = 'MASUKKAN_VALID_TENANT_UUID_DI_SINI'
  
  console.log('Memulai pengujian 10 request pembuatan nomor Purchase Order secara bersamaan...')
  
  const promises = Array.from({ length: 10 }, () => 
    IdentifierDomainService.generatePurchaseNumber(tenantId)
  )

  try {
    const results = await Promise.all(promises)
    console.log('Hasil Nomor PO:', results)
    
    // Validasi apakah ada nomor yang duplikat
    const uniqueResults = new Set(results)
    if (uniqueResults.size === results.length) {
      console.log('SUKSES: Semua nomor unik, tidak ada duplikasi!')
    } else {
      console.error('GAGAL: Ditemukan nomor yang duplikat!')
    }
  } catch (error) {
    console.error('Error saat testing:', error)
  }
}

runConcurrencyTest()