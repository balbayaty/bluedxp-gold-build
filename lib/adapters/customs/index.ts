/**
 * Customs Adapters - Main Export
 * All country-specific and system-specific adapters
 */

// Egypt
export { CargoXAdapter, NAFEZAAdapter } from './egypt'
export type { CargoXConfig, NAFEZAConfig } from './egypt'

// Saudi Arabia
export { FASAHAdapter } from './saudi'
export type { FASAHConfig } from './saudi'

// Base
export { BaseCustomsAdapter } from './base/CustomsAdapter'
export type { CustomsAdapterConfig } from '@/types/customs'

/**
 * Adapter Factory
 * Creates appropriate adapter based on country and system
 */
export function createCustomsAdapter(
  country: string,
  system: string,
  config: any
): any {
  switch (country) {
    case 'EG':
      if (system === 'cargox') {
        const { CargoXAdapter } = require('./egypt/CargoXAdapter')
        return new CargoXAdapter(config)
      } else if (system === 'nafeza') {
        const { NAFEZAAdapter } = require('./egypt/NAFEZAAdapter')
        return new NAFEZAAdapter(config)
      }
      break
    case 'SA':
      if (system === 'fasah') {
        const { FASAHAdapter } = require('./saudi/FASAHAdapter')
        return new FASAHAdapter(config)
      }
      break
    case 'AE':
      if (system === 'dubai-trade' || system === 'dubaitrade') {
        const { DubaiTradeAdapter } = require('./uae/DubaiTradeAdapter')
        return new DubaiTradeAdapter(config)
      }
      break
    case 'KW':
      if (system === 'asycuda') {
        const { ASYCUDAAdapter } = require('./kuwait/ASYCUDAAdapter')
        return new ASYCUDAAdapter(config)
      }
      break
    case 'TIR':
    case 'ETIR':
      if (system === 'etir' || system === 'tir') {
        const { ETIRAdapter } = require('./tir/ETIRAdapter')
        return new ETIRAdapter(config)
      }
      break
  }

  throw new Error(`No adapter found for country: ${country}, system: ${system}`)
}













