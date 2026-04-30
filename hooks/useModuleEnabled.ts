/**
 * React Hook: useModuleEnabled
 * 
 * Check if a module is enabled
 */

import { useMemo } from 'react'
import { isModuleEnabled } from '@/lib/modules/registry'

export function useModuleEnabled(moduleId: string): boolean {
  return useMemo(() => {
    return isModuleEnabled(moduleId)
  }, [moduleId])
}



