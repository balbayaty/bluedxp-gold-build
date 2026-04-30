/**
 * QR Service Test Script
 * Tests QR code generation, MSDS inclusion, and scan tracking
 */

const testQRService = async () => {
  console.log('🧪 Testing QR Service...\n')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Test 1: Generate MSDS QR Code
  console.log('Test 1: Generate MSDS QR Code with Full Data')
  try {
    const response = await fetch(`${baseUrl}/api/qr/msds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msdsId: 'test-msds-001',
        options: {
          includeFullData: true,
          analytics: true,
          dynamic: true
        }
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ QR Code Generated Successfully')
      console.log(`   QR ID: ${result.qrId}`)
      console.log(`   MSDS Included: ${result.msdsIncluded ? 'Yes' : 'No'}`)
      console.log(`   QR Image URL: ${result.qrImageUrl ? 'Generated' : 'Not Generated'}`)
      
      // Test 2: Verify QR Code Structure
      console.log('\nTest 2: Verify QR Code Structure')
      try {
        const qrData = JSON.parse(result.qrCode)
        console.log('✅ QR Code is Valid JSON')
        console.log(`   Type: ${qrData.type}`)
        console.log(`   Document Type: ${qrData.documentType}`)
        console.log(`   Has MSDS Data: ${qrData.metadata?.msdsData ? 'Yes' : 'No'}`)
        console.log(`   Is Dynamic: ${qrData.dynamic}`)
        console.log(`   URL: ${qrData.url}`)
      } catch (error) {
        console.error('❌ QR Code is not valid JSON:', error.message)
      }

      // Test 3: Test Scan Tracking
      if (result.qrId) {
        console.log('\nTest 3: Test Scan Tracking')
        try {
          const trackResponse = await fetch(`${baseUrl}/api/qr/scan/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrId: result.qrId
            })
          })

          const trackResult = await trackResponse.json()
          
          if (trackResult.success && trackResult.tracked) {
            console.log('✅ Scan Tracking Works')
            console.log(`   Location: ${trackResult.location?.city || 'Unknown'}, ${trackResult.location?.country || 'Unknown'}`)
            console.log(`   IP: ${trackResult.location?.ip || 'Unknown'}`)
            console.log(`   Device: ${trackResult.device?.device || 'Unknown'}`)
          } else {
            console.warn('⚠️ Scan tracking returned:', trackResult)
          }
        } catch (error) {
          console.error('❌ Scan tracking failed:', error.message)
        }
      }

      // Test 4: Get Analytics
      if (result.qrId) {
        console.log('\nTest 4: Get QR Analytics')
        try {
          const analyticsResponse = await fetch(`${baseUrl}/api/qr/analytics?qrId=${result.qrId}`)
          const analyticsResult = await analyticsResponse.json()
          
          if (analyticsResult.success) {
            console.log('✅ Analytics Retrieved')
            console.log(`   Total Scans: ${analyticsResult.analytics?.totalScans || 0}`)
            console.log(`   Unique Scans: ${analyticsResult.analytics?.uniqueScans || 0}`)
          } else {
            console.warn('⚠️ Analytics not available:', analyticsResult.error)
          }
        } catch (error) {
          console.error('❌ Analytics retrieval failed:', error.message)
        }
      }

    } else {
      console.error('❌ QR Code Generation Failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test Failed:', error.message)
  }

  // Test 5: Test QR Verification API
  console.log('\nTest 5: Test QR Verification API')
  try {
    const testResponse = await fetch(`${baseUrl}/api/qr/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-msds',
        msdsId: 'test-msds-001'
      })
    })

    const testResult = await testResponse.json()
    
    if (testResult.success) {
      console.log('✅ QR Test API Works')
      console.log(`   Verification Valid: ${testResult.verification?.valid ? 'Yes' : 'No'}`)
      if (testResult.verification?.errors?.length > 0) {
        console.log(`   Errors: ${testResult.verification.errors.join(', ')}`)
      }
      if (testResult.verification?.warnings?.length > 0) {
        console.log(`   Warnings: ${testResult.verification.warnings.join(', ')}`)
      }
    } else {
      console.warn('⚠️ QR Test API returned:', testResult.error)
    }
  } catch (error) {
    console.error('❌ QR Test API failed:', error.message)
  }

  // Test 6: Get All Scans
  console.log('\nTest 6: Get All Scans')
  try {
    const scansResponse = await fetch(`${baseUrl}/api/qr/scans?limit=10`)
    const scansResult = await scansResponse.json()
    
    if (scansResult.success) {
      console.log('✅ Scans API Works')
      console.log(`   Total Scans: ${scansResult.count || 0}`)
      console.log(`   Statistics Available: ${scansResult.statistics ? 'Yes' : 'No'}`)
    } else {
      console.warn('⚠️ Scans API returned:', scansResult.error)
    }
  } catch (error) {
    console.error('❌ Scans API failed:', error.message)
  }

  console.log('\n✅ Testing Complete!')
}

// Run tests
if (require.main === module) {
  testQRService().catch(console.error)
}

module.exports = { testQRService }







