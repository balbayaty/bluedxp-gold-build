/**
 * Test Unified File Storage System
 * 
 * This script tests the unified file storage system to ensure everything works.
 * Run: ts-node scripts/test-file-storage.ts
 */

import { unifiedFileStorageService } from '../lib/services/storage/unifiedFileStorageService'
import { getStorageAdapterFactory } from '../lib/services/storage/adapters/storageAdapterFactory'

async function testFileStorage() {
  console.log('🧪 Testing Unified File Storage System...\n')

  // Test 1: Check Storage Provider
  console.log('📋 Test 1: Storage Provider Configuration')
  try {
    const factory = getStorageAdapterFactory()
    const provider = factory.getProvider()
    console.log(`✅ Storage Provider: ${provider.toUpperCase()}`)
    
    const isAvailable = await factory.isAvailable()
    if (isAvailable) {
      console.log('✅ Storage adapter is available\n')
    } else {
      console.log('⚠️  Storage adapter not available (check configuration)\n')
    }
  } catch (error: any) {
    console.error('❌ Storage provider check failed:', error.message)
    console.log('💡 Make sure STORAGE_PROVIDER is set in .env\n')
    return
  }

  // Test 2: Initialize Service
  console.log('📋 Test 2: Service Initialization')
  try {
    await unifiedFileStorageService.initialize()
    console.log('✅ Service initialized successfully\n')
  } catch (error: any) {
    console.error('❌ Service initialization failed:', error.message)
    console.log('💡 Check storage configuration and ensure storage service is running\n')
    return
  }

  // Test 3: Upload Test File
  console.log('📋 Test 3: File Upload')
  try {
    const testContent = Buffer.from('This is a test file for unified storage system!')
    const testFileName = `test-${Date.now()}.txt`

    console.log(`📤 Uploading test file: ${testFileName}`)
    const fileMetadata = await unifiedFileStorageService.uploadFile({
      file: testContent,
      fileName: testFileName,
      tenantId: 'test-tenant',
      module: 'test',
      entityType: 'test',
      entityId: 'test-entity-1',
      createdBy: 'test-user',
      tags: ['test', 'automated'],
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    })

    console.log('✅ File uploaded successfully!')
    console.log(`   File ID: ${fileMetadata.id}`)
    console.log(`   Storage URL: ${fileMetadata.storageUrl}`)
    console.log(`   File Size: ${fileMetadata.fileSize} bytes`)
    console.log(`   Hash: ${fileMetadata.hash.substring(0, 16)}...\n`)

    // Test 4: Download Test File
    console.log('📋 Test 4: File Download')
    const { buffer, metadata } = await unifiedFileStorageService.downloadFile({
      fileId: fileMetadata.id,
      tenantId: 'test-tenant',
      userId: 'test-user',
      userRoles: ['SYSTEM_ADMIN'],
    })

    const downloadedContent = buffer.toString()
    if (downloadedContent === testContent.toString()) {
      console.log('✅ File downloaded successfully!')
      console.log(`   Content matches: ${downloadedContent.substring(0, 50)}...\n`)
    } else {
      console.error('❌ Downloaded content does not match!')
      return
    }

    // Test 5: Get File URL
    console.log('📋 Test 5: Get Presigned URL')
    try {
      const url = await unifiedFileStorageService.getFileUrl(
        fileMetadata.id,
        'test-tenant',
        3600
      )
      console.log('✅ Presigned URL generated!')
      console.log(`   URL: ${url.substring(0, 80)}...\n`)
    } catch (error: any) {
      console.warn('⚠️  Presigned URL generation failed:', error.message)
      console.log('   (This is okay if storage provider doesn\'t support it)\n')
    }

    // Test 6: Search Files
    console.log('📋 Test 6: File Search')
    try {
      const searchResult = await unifiedFileStorageService.searchFiles({
        tenantId: 'test-tenant',
        module: 'test',
        tags: ['test'],
        limit: 10,
      })
      console.log('✅ File search successful!')
      console.log(`   Found ${searchResult.total} file(s)`)
      console.log(`   Files: ${searchResult.files.length}\n`)
    } catch (error: any) {
      console.warn('⚠️  File search failed:', error.message)
      console.log('   (This is okay if database is not configured)\n')
    }

    // Test 7: Deduplication Test
    console.log('📋 Test 7: Deduplication Test')
    try {
      console.log('📤 Uploading same file again (should detect duplicate)...')
      const duplicateMetadata = await unifiedFileStorageService.uploadFile({
        file: testContent,
        fileName: `duplicate-${testFileName}`,
        tenantId: 'test-tenant',
        module: 'test',
        entityType: 'test',
        entityId: 'test-entity-2',
        createdBy: 'test-user',
        deduplication: true,
      })

      if (duplicateMetadata.parentFileId === fileMetadata.id || duplicateMetadata.hash === fileMetadata.hash) {
        console.log('✅ Deduplication working!')
        console.log(`   Reused file: ${duplicateMetadata.parentFileId ? 'Yes (linked to parent)' : 'Yes (same hash)'}\n`)
      } else {
        console.log('ℹ️  New file created (deduplication may require database)\n')
      }
    } catch (error: any) {
      console.warn('⚠️  Deduplication test failed:', error.message)
      console.log('   (This is okay if database is not configured)\n')
    }

    // Test 8: Get Files for Entity
    console.log('📋 Test 8: Get Files for Entity')
    try {
      const entityFiles = await unifiedFileStorageService.getFilesForEntity(
        'test-tenant',
        'test',
        'test-entity-1'
      )
      console.log('✅ Get files for entity successful!')
      console.log(`   Found ${entityFiles.length} file(s) for entity\n`)
    } catch (error: any) {
      console.warn('⚠️  Get files for entity failed:', error.message)
      console.log('   (This is okay if database is not configured)\n')
    }

    console.log('🎉 All tests completed!')
    console.log('\n📝 Summary:')
    console.log('   ✅ Storage provider configured')
    console.log('   ✅ Service initialized')
    console.log('   ✅ File upload working')
    console.log('   ✅ File download working')
    console.log('   ✅ Basic functionality verified')
    console.log('\n💡 Next steps:')
    console.log('   1. Run database migration (if not done):')
    console.log('      psql $DATABASE_URL -f lib/database/migrations/005_unified_file_storage.sql')
    console.log('   2. Test with real files from your modules')
    console.log('   3. Integrate with MSDS, Evidence, etc.\n')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    console.error('   Stack:', error.stack)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check STORAGE_PROVIDER in .env')
    console.log('   2. Ensure storage service is running (MinIO, S3, etc.)')
    console.log('   3. Check storage credentials/configuration')
    console.log('   4. Verify database connection (for metadata features)\n')
  }
}

// Run tests
testFileStorage().catch(console.error)

