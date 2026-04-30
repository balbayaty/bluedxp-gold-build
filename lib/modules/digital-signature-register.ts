/**
 * Digital Signature Module Registration
 * Registers the module with the module registry
 */

import { moduleRegistry } from './registry'
import { digitalSignatureModule } from './digital-signature'

// Register the module
moduleRegistry.register(digitalSignatureModule)

console.log('✅ Digital Signature Module registered')





