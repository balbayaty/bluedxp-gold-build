import type { Action, FeatureId, ModuleId } from '@/types/user'

export type CopilotToolRisk = 'read_only' | 'sensitive' | 'destructive'

export type CopilotToolId = string

export type CopilotToolDefinition = {
  id: CopilotToolId
  name: string
  description: string

  /**
   * The module/feature/action that this tool maps to for RBAC enforcement.
   * This is checked in addition to the API route RBAC.
   */
  moduleId: ModuleId
  featureId?: FeatureId
  action: Action

  risk: CopilotToolRisk
  requiresConfirmation?: boolean

  // Light-weight schema hints (not a full JSON Schema system, but enough for UI + docs).
  inputHint?: Record<string, string>
  outputHint?: Record<string, string>
}

export type CopilotToolExecutionRequest = {
  toolId: CopilotToolId
  input: unknown
  /**
   * Optional explicit confirmation for tools marked `requiresConfirmation`.
   * If false/missing, server will return 409 with `requiresConfirmation: true`.
   */
  confirm?: boolean
}

export type CopilotToolExecutionResponse =
  | {
      success: true
      toolId: CopilotToolId
      output: unknown
      evidenceId?: string
    }
  | {
      success: false
      toolId: CopilotToolId
      error: string
      requiresConfirmation?: boolean
    }


