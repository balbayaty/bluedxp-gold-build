/**
 * OpenSearch Usage Examples
 * How to use OpenSearch for search and analytics in BlueDXP Platform
 */

import { searchService } from '@/lib/services/search'

// Example: Index a document
export async function indexDocumentExample() {
  try {
    // Initialize service
    await searchService.initialize()

    // Index a shipment document
    await searchService.index(
      {
        id: 'ship_123',
        type: 'shipment',
        origin: 'Riyadh',
        destination: 'Jeddah',
        status: 'in_transit',
        weight: 1000,
        tenantId: 'tenant_456',
        createdAt: new Date().toISOString(),
      },
      'ship_123', // Document ID
      'shipments' // Index name (optional)
    )

    console.log('✅ Document indexed')
  } catch (error) {
    console.error('❌ Error indexing document:', error)
    throw error
  }
}

// Example: Search documents
export async function searchDocumentsExample(query: string) {
  try {
    const results = await searchService.search({
      query,
      filters: {
        tenantId: 'tenant_456',
      },
      sort: [
        { createdAt: { order: 'desc' } },
      ],
      from: 0,
      size: 10,
    })

    console.log('✅ Search results:', results.total, 'found')
    results.hits.forEach((hit) => {
      console.log(`  - ${hit.id}: ${hit.score}`)
    })

    return results
  } catch (error) {
    console.error('❌ Error searching:', error)
    throw error
  }
}

// Example: Delete a document
export async function deleteDocumentExample(documentId: string) {
  try {
    await searchService.delete(documentId)
    console.log('✅ Document deleted')
  } catch (error) {
    console.error('❌ Error deleting document:', error)
    throw error
  }
}

