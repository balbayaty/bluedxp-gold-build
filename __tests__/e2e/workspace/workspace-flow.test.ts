/**
 * Workspace Module - End-to-End Tests
 * 
 * Tests complete user workflows for the workspace module
 * 
 * Note: These tests require a running database connection
 * Run with: npm run test:e2e
 */

import { prisma } from '@/lib/services/database/prismaClient'
import { workspaceService } from '@/lib/services/workspace/workspaceService'
import { widgetService } from '@/lib/services/workspace/widgetService'
import { categoryService } from '@/lib/services/workspace/categoryService'
import { layoutService } from '@/lib/services/workspace/layoutService'
import { userService } from '@/lib/services/user/userService'

describe('Workspace Module - E2E Tests', () => {
  const testUserId = 'e2e-test-user-' + Date.now()
  const testTenantId = 'e2e-test-tenant'

  beforeAll(async () => {
    // Ensure test user exists
    try {
      // Try to get existing user first
      let user = await userService.getUserById(testUserId)
      
      if (!user) {
        // Create user if doesn't exist
        user = await userService.createUser({
          id: testUserId,
          tenantId: testTenantId,
          email: `e2e-test-${Date.now()}@example.com`,
          name: 'E2E Test User',
          role: 'SYSTEM_ADMIN',
        })
      }
      
      expect(user).toBeDefined()
      expect(user.id).toBe(testUserId)
    } catch (error: any) {
      console.error('Error setting up test user:', error.message)
      // Continue anyway - might work with existing user
    }
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.workspaceLayout.deleteMany({
        where: { userId: testUserId },
      })
      await prisma.userWidget.deleteMany({
        where: { userId: testUserId },
      })
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => {})
    } catch (error) {
      // Ignore cleanup errors
    } finally {
      await prisma.$disconnect()
    }
  })

  describe('E2E: Complete Workspace Flow', () => {
    it('should complete full workspace lifecycle', async () => {
      // Step 1: Get workspace configuration
      console.log('Step 1: Getting workspace configuration...')
      const config = await workspaceService.getWorkspaceConfig(testUserId)
      expect(config).toBeDefined()
      expect(config.userId).toBe(testUserId)
      expect(config.availableWidgets).toBeDefined()
      expect(config.availableCategories).toBeDefined()
      expect(Array.isArray(config.availableWidgets)).toBe(true)
      expect(Array.isArray(config.availableCategories)).toBe(true)
      console.log(`✅ Found ${config.availableWidgets.length} widgets and ${config.availableCategories.length} categories`)

      // Step 2: Get available widgets
      console.log('Step 2: Getting available widgets...')
      const widgets = await widgetService.getWidgetDefinitions({
        userId: testUserId,
        tenantId: testTenantId,
      })
      expect(widgets.length).toBeGreaterThan(0)
      const firstWidget = widgets[0]
      expect(firstWidget).toHaveProperty('id')
      expect(firstWidget).toHaveProperty('name')
      expect(firstWidget).toHaveProperty('type')
      console.log(`✅ Found ${widgets.length} available widgets`)

      // Step 3: Get categories
      console.log('Step 3: Getting categories...')
      const categories = await categoryService.getCategories(testTenantId)
      expect(categories.length).toBeGreaterThan(0)
      const firstCategory = categories[0]
      expect(firstCategory).toHaveProperty('id')
      expect(firstCategory).toHaveProperty('name')
      expect(firstCategory).toHaveProperty('slug')
      console.log(`✅ Found ${categories.length} categories`)

      // Step 4: Create a workspace layout
      console.log('Step 4: Creating workspace layout...')
      const layout = await layoutService.saveLayout(testUserId, {
        name: 'E2E Test Layout',
        description: 'Test layout created by E2E test',
        widgets: [
          {
            widgetDefId: firstWidget.id,
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
      })
      expect(layout).toBeDefined()
      expect(layout.id).toBeDefined()
      expect(layout.name).toBe('E2E Test Layout')
      expect(layout.userId).toBe(testUserId)
      console.log(`✅ Created layout: ${layout.id}`)

      // Step 5: Load the layout
      console.log('Step 5: Loading workspace layout...')
      const loadedLayout = await layoutService.loadLayout(layout.id, testUserId)
      expect(loadedLayout).toBeDefined()
      expect(loadedLayout.id).toBe(layout.id)
      expect(loadedLayout.name).toBe('E2E Test Layout')
      console.log(`✅ Loaded layout: ${loadedLayout.id}`)

      // Step 6: Get user layouts
      console.log('Step 6: Getting user layouts...')
      const userLayouts = await layoutService.getUserLayouts(testUserId)
      expect(userLayouts.length).toBeGreaterThan(0)
      const foundLayout = userLayouts.find(l => l.id === layout.id)
      expect(foundLayout).toBeDefined()
      console.log(`✅ Found ${userLayouts.length} user layouts`)

      // Step 7: Set as default layout
      console.log('Step 7: Setting as default layout...')
      await layoutService.setDefaultLayout(layout.id, testUserId)
      const defaultLayout = await layoutService.getDefaultLayout(testUserId)
      expect(defaultLayout).toBeDefined()
      expect(defaultLayout?.id).toBe(layout.id)
      console.log(`✅ Set layout as default`)

      // Step 8: Duplicate layout
      console.log('Step 8: Duplicating layout...')
      const duplicatedLayout = await layoutService.duplicateLayout(layout.id, testUserId, {
        name: 'E2E Test Layout - Copy',
      })
      expect(duplicatedLayout).toBeDefined()
      expect(duplicatedLayout.id).not.toBe(layout.id)
      expect(duplicatedLayout.name).toBe('E2E Test Layout - Copy')
      console.log(`✅ Duplicated layout: ${duplicatedLayout.id}`)

      // Step 9: Update layout
      console.log('Step 9: Updating layout...')
      const updatedLayout = await layoutService.updateLayout(layout.id, testUserId, {
        name: 'E2E Test Layout - Updated',
      })
      expect(updatedLayout).toBeDefined()
      expect(updatedLayout.name).toBe('E2E Test Layout - Updated')
      console.log(`✅ Updated layout: ${updatedLayout.id}`)

      // Step 10: Delete duplicated layout
      console.log('Step 10: Deleting duplicated layout...')
      await layoutService.deleteLayout(duplicatedLayout.id, testUserId)
      const layoutsAfterDelete = await layoutService.getUserLayouts(testUserId)
      const deletedLayout = layoutsAfterDelete.find(l => l.id === duplicatedLayout.id)
      expect(deletedLayout).toBeUndefined()
      console.log(`✅ Deleted layout: ${duplicatedLayout.id}`)

      console.log('✅ E2E Test: Complete workspace lifecycle - PASSED')
    }, 30000) // 30 second timeout

    it('should handle widget data retrieval', async () => {
      console.log('Testing widget data retrieval...')
      
      // Get a widget
      const widgets = await widgetService.getWidgetDefinitions({
        userId: testUserId,
        tenantId: testTenantId,
      })
      expect(widgets.length).toBeGreaterThan(0)
      const widget = widgets[0]

      // Get widget data
      const widgetData = await widgetService.getWidgetData(widget.id, {
        userId: testUserId,
        tenantId: testTenantId,
      })
      
      expect(widgetData).toBeDefined()
      expect(widgetData).toHaveProperty('widgetId', widget.id)
      console.log(`✅ Retrieved data for widget: ${widget.name}`)
    }, 15000)

    it('should validate widget access permissions', async () => {
      console.log('Testing widget access validation...')
      
      const widgets = await widgetService.getWidgetDefinitions({
        userId: testUserId,
        tenantId: testTenantId,
      })
      expect(widgets.length).toBeGreaterThan(0)
      const widget = widgets[0]

      // Validate access
      const hasAccess = await widgetService.validateWidgetAccess(widget.id, {
        userId: testUserId,
        tenantId: testTenantId,
      })
      
      expect(hasAccess).toBe(true)
      console.log(`✅ Widget access validated: ${widget.name}`)
    }, 10000)
  })

  describe('E2E: Category Management', () => {
    it('should retrieve and filter categories', async () => {
      console.log('Testing category retrieval...')
      
      const categories = await categoryService.getCategories(testTenantId)
      expect(categories.length).toBeGreaterThan(0)
      
      // Filter system categories
      const systemCategories = categories.filter(c => c.isSystem)
      expect(systemCategories.length).toBeGreaterThan(0)
      
      console.log(`✅ Found ${categories.length} categories (${systemCategories.length} system)`)
    }, 10000)
  })
})

