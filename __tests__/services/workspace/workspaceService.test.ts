/**
 * Workspace Service Tests
 */

import { workspaceService } from '@/lib/services/workspace/workspaceService'
import { prisma } from '@/lib/services/database/prismaClient'

// Mock dependencies
jest.mock('@/lib/services/database/prismaClient')
jest.mock('@/lib/services/user/userService')
jest.mock('@/lib/services/event-bus')

describe('WorkspaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWorkspaceConfig', () => {
    it('should return workspace configuration for user', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'SYSTEM_ADMIN',
      }

      const mockWidgets = [
        { id: 'widget-1', name: 'Test Widget', isActive: true },
      ]

      const mockCategories = [
        { id: 'cat-1', name: 'METRICS', isSystem: true },
      ]

      // Mock prisma calls
      ;(prisma.widgetDefinition.findMany as jest.Mock).mockResolvedValue(mockWidgets)
      ;(prisma.widgetCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)
      ;(prisma.googleWorkspaceIntegration.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.emailIntegration.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.workspaceLayout.findFirst as jest.Mock).mockResolvedValue(null)

      const config = await workspaceService.getWorkspaceConfig('user-1')

      expect(config).toBeDefined()
      expect(config.userId).toBe('user-1')
      expect(config.availableWidgets).toBeDefined()
      expect(config.availableCategories).toBeDefined()
    })
  })

  describe('saveLayout', () => {
    it('should save layout successfully', async () => {
      const mockLayout = {
        id: 'layout-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        name: 'Test Layout',
        widgets: [],
        isDefault: false,
        isTemplate: false,
      }

      ;(prisma.workspaceLayout.create as jest.Mock).mockResolvedValue(mockLayout)
      ;(prisma.workspaceLayout.findFirst as jest.Mock).mockResolvedValue(mockLayout)

      const layout = await workspaceService.saveLayout('user-1', {
        name: 'Test Layout',
      })

      expect(layout).toBeDefined()
      expect(layout.name).toBe('Test Layout')
    })
  })
})













