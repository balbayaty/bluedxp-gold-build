import type { CustomsAdapter, CustomsSubmissionRequest, CustomsSubmissionResult } from './base'

export const mockCustomsAdapter: CustomsAdapter = {
  id: 'mock',
  name: 'Mock Customs Adapter',
  async submitDeclaration(req: CustomsSubmissionRequest): Promise<CustomsSubmissionResult> {
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 250))
    return {
      provider: 'mock',
      status: 'UNDER_REVIEW',
      externalReference: `MOCK-${req.countryCode || 'XX'}-${req.declarationId}`,
      message: `Submission accepted by mock adapter for tenant ${req.tenantId}`,
    }
  },
}


