/**
 * Seed Middle East Land Port Geofences
 * 
 * Bulk import all Middle East land ports as geofence zones
 * 
 * Usage:
 *   npx tsx scripts/seed-middle-east-port-geofences.ts [tenantId] [country]
 * 
 * Examples:
 *   npx tsx scripts/seed-middle-east-port-geofences.ts
 *   npx tsx scripts/seed-middle-east-port-geofences.ts tenant-1
 *   npx tsx scripts/seed-middle-east-port-geofences.ts tenant-1 SA
 */

import { geofenceZoneService } from '../lib/services/geofence'
import { portGeofenceConverter } from '../lib/services/geofence/port-geofence-converter'
import { 
  allMiddleEastLandPorts, 
  getLandPortsByCountry 
} from '../data/geofences/middle-east-land-ports'

async function main() {
  const tenantId = process.argv[2] || 'default'
  const countryFilter = process.argv[3] // Optional country filter (e.g., 'SA', 'AE', 'KW')
  
  console.log('🌍 Middle East Land Port Geofence Seeding')
  console.log('==========================================')
  console.log(`Tenant ID: ${tenantId}`)
  if (countryFilter) {
    console.log(`Country Filter: ${countryFilter}`)
  }
  console.log('')

  // Get ports to import
  let portsToImport = allMiddleEastLandPorts
  if (countryFilter) {
    portsToImport = getLandPortsByCountry(countryFilter.toUpperCase())
    if (portsToImport.length === 0) {
      console.error(`❌ No ports found for country: ${countryFilter}`)
      process.exit(1)
    }
  }

  console.log(`📋 Found ${portsToImport.length} ports to import`)
  console.log('')

  // Validate ports
  console.log('🔍 Validating ports...')
  const validation = portGeofenceConverter.validatePorts(portsToImport)
  
  if (validation.invalidPorts.length > 0) {
    console.error('❌ Validation failed:')
    for (const { port, errors } of validation.invalidPorts) {
      console.error(`  - ${port.name} (${port.code}): ${errors.join(', ')}`)
    }
    process.exit(1)
  }
  
  console.log(`✅ All ${validation.validPorts.length} ports are valid`)
  console.log('')

  // Convert to geofence zones
  console.log('🔄 Converting ports to geofence zones...')
  const zones = portGeofenceConverter.convertPortsToGeofences(
    validation.validPorts,
    tenantId
  )
  console.log(`✅ Converted ${zones.length} ports to geofence zones`)
  console.log('')

  // Import zones
  console.log('📥 Importing geofence zones...')
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [] as Array<{ zoneId: string; error: string }>,
  }

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    const progress = `[${i + 1}/${zones.length}]`
    
    try {
      // Check if zone already exists
      const existing = await geofenceZoneService.getZone(zone.id, tenantId)
      
      if (existing) {
        console.log(`${progress} ⏭️  Skipped: ${zone.name} (already exists)`)
        results.skipped++
        continue
      }

      // Create new zone
      await geofenceZoneService.createZone(zone)
      console.log(`${progress} ✅ Created: ${zone.name}`)
      results.created++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`${progress} ❌ Error: ${zone.name} - ${errorMessage}`)
      results.errors++
      results.errorDetails.push({
        zoneId: zone.id,
        error: errorMessage,
      })
    }
  }

  // Summary
  console.log('')
  console.log('📊 Import Summary')
  console.log('=================')
  console.log(`Total ports: ${zones.length}`)
  console.log(`✅ Created: ${results.created}`)
  console.log(`⏭️  Skipped: ${results.skipped}`)
  console.log(`❌ Errors: ${results.errors}`)
  console.log('')

  if (results.errors > 0) {
    console.log('Error Details:')
    for (const { zoneId, error } of results.errorDetails) {
      console.log(`  - ${zoneId}: ${error}`)
    }
    console.log('')
  }

  if (results.created > 0) {
    console.log('🎉 Successfully imported geofence zones!')
  }

  if (results.errors > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})



