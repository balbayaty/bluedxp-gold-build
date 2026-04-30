export type CopilotWorkflowId =
  | 'wf.customs.clearance.v1'
  | 'wf.msds.intake.v1'
  | 'wf.evidence.packet.v1'
  | 'wf.proposals.draft.v1'

export type CopilotWorkflowStepKind = 'tool' | 'info' | 'approval'

export type CopilotWorkflowContext = {
  tenantId: string
  userId: string
}

export type CopilotWorkflowState = {
  // generic bag to keep this future-proof
  [key: string]: unknown
}

export type CopilotWorkflowStep = {
  id: string
  title: string
  description?: string
  kind: CopilotWorkflowStepKind
  toolId?: string
  // UI hint: minimal inputs the user should provide
  inputHint?: Record<string, string>
  // Soft requirements the UI can enforce before enabling the step
  requires?: Array<{ key: string; description: string }>
}

export type CopilotWorkflowDefinition = {
  id: CopilotWorkflowId
  name: string
  description: string
  moduleId: string
  // Ordered steps (mission)
  steps: CopilotWorkflowStep[]
}

export type CopilotWorkflowListItem = Pick<
  CopilotWorkflowDefinition,
  'id' | 'name' | 'description' | 'moduleId' | 'steps'
>


