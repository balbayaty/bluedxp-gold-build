/**
 * MinIO Usage Examples
 * How to use MinIO object storage in BlueDXP Platform
 */

import { objectStorageService } from '@/lib/services/storage'

// Example: Upload a file
export async function uploadFileExample() {
  try {
    // Initialize service
    await objectStorageService.initialize()

    // Upload a file
    const fileContent = Buffer.from('Hello, BlueDXP!')
    const objectName = await objectStorageService.upload(
      'documents/example.txt',
      fileContent,
      {
        contentType: 'text/plain',
        metadata: {
          'uploaded-by': 'user_123',
          'tenant-id': 'tenant_456',
        },
      }
    )

    console.log('✅ File uploaded:', objectName)
    return objectName
  } catch (error) {
    console.error('❌ Error uploading file:', error)
    throw error
  }
}

// Example: Download a file
export async function downloadFileExample(objectName: string) {
  try {
    const fileContent = await objectStorageService.download(objectName)
    console.log('✅ File downloaded:', fileContent.toString())
    return fileContent
  } catch (error) {
    console.error('❌ Error downloading file:', error)
    throw error
  }
}

// Example: Get presigned URL
export async function getPresignedUrlExample(objectName: string) {
  try {
    // Get URL valid for 1 hour
    const url = await objectStorageService.getUrl(objectName, 3600)
    console.log('✅ Presigned URL:', url)
    return url
  } catch (error) {
    console.error('❌ Error generating URL:', error)
    throw error
  }
}

// Example: List files
export async function listFilesExample(prefix?: string) {
  try {
    const files = await objectStorageService.list(prefix)
    console.log('✅ Files found:', files.length)
    files.forEach((file) => {
      console.log(`  - ${file.name} (${file.size} bytes)`)
    })
    return files
  } catch (error) {
    console.error('❌ Error listing files:', error)
    throw error
  }
}

