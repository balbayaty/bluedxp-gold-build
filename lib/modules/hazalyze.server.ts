/**
 * Hazalyze Module Initialization (Server-Side Only)
 * Sets up AI services, agents, and knowledge base
 */

import { hazalyzeModule } from './hazalyze'

/**
 * Initialize Hazalyze Module
 * Sets up AI services, agents, and knowledge base
 * 
 * This initialization is flexible and won't break if services
 * don't have explicit initialize functions - they'll initialize
 * on first use instead.
 */
export async function initializeHazalyzeModule(): Promise<void> {
    try {
        // Initialize AI services
        console.log('🤖 Initializing Hazalyze AI Module...')

        // Pre-load services to ensure they're available
        // Services will initialize on first use if they don't have explicit init functions

        // Pre-import knowledge base service if enabled
        if (hazalyzeModule.config?.knowledgeBase?.enabled) {
            try {
                await import('@/lib/services/knowledge-base/knowledgeBaseService')
                console.log('✅ Knowledge Base service loaded')
            } catch (error) {
                console.warn('⚠️ Knowledge Base service load failed:', error)
            }
        }

        // Pre-import agent orchestrator if enabled
        if (hazalyzeModule.config?.agents?.enabled) {
            try {
                await import('@/lib/services/agents/agentOrchestrator')
                console.log('✅ AI Agents service loaded')
            } catch (error) {
                console.warn('⚠️ AI Agents service load failed:', error)
            }
        }

        // Pre-import vision cache service if enabled
        if (hazalyzeModule.config?.vision?.cacheEnabled) {
            try {
                await import('@/lib/services/ai/visionCacheService')
                console.log('✅ Vision Cache service loaded')
            } catch (error) {
                console.warn('⚠️ Vision Cache service load failed:', error)
            }
        }

        // Pre-import copilot service
        try {
            await import('@/lib/services/copilot/copilotService')
            console.log('✅ Copilot service loaded')
        } catch (error) {
            console.warn('⚠️ Copilot service load failed:', error)
        }

        console.log('✅ Hazalyze AI Module initialized successfully')
    } catch (error) {
        console.error('❌ Hazalyze Module initialization error:', error)
        // Don't throw - allow module to work even if initialization has issues
        // Services will initialize on first use
    }
}
