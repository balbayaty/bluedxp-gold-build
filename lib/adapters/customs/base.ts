export type CustomsSubmissionRequest = {
  tenantId: string
  declarationId: string
  system?: string
  countryCode?: string
}

export type CustomsSubmissionResult = {
  provider: string
  status: 'UNDER_REVIEW' | 'SUBMITTED' | 'REJECTED' | 'FAILED'
  externalReference?: string
  message?: string
}

export interface CustomsAdapter {
  id: string
  name: string
  submitDeclaration(req: CustomsSubmissionRequest): Promise<CustomsSubmissionResult>
}


