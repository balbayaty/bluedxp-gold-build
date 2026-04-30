/**
 * Register FLEX Warehouse Cameras
 * Bulk registration script for all cameras from PDF data
 */

import { dahuaCameraService } from '@/lib/services/cameras'
import cameraData from '@/data/cameras/flex-warehouse-cameras.json'

interface CameraConfig {
  cameraId: string
  name: string
  ipAddress: string
  port: number
  username: string
  password: string
  nvrChannel?: string
  warehouseId: string
  zone: string
  switch?: string
}

async function registerCameras() {
  console.log('🎥 Starting camera registration for FLEX warehouses...\n')

  const cameras = cameraData.cameras as CameraConfig[]
  const results = {
    success: [] as string[],
    failed: [] as Array<{ cameraId: string; error: string }>,
    total: cameras.length
  }

  for (const camera of cameras) {
    try {
      console.log(`Registering: ${camera.name} (${camera.ipAddress})...`)

      const registeredCamera = await dahuaCameraService.registerCamera({
        ipAddress: camera.ipAddress,
        port: camera.port,
        username: camera.username,
        password: camera.password,
        model: 'Dahua IP Camera', // Model can be discovered later
        serialNumber: camera.cameraId
      })

      // Update camera location
      if (registeredCamera) {
        registeredCamera.location = {
          warehouseId: camera.warehouseId,
          zone: camera.zone
        }
        registeredCamera.name = camera.name
        registeredCamera.metadata = {
          nvrChannel: camera.nvrChannel,
          switch: camera.switch,
          cameraId: camera.cameraId
        }
      }

      results.success.push(camera.cameraId)
      console.log(`✅ Registered: ${camera.name}\n`)
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error'
      results.failed.push({
        cameraId: camera.cameraId,
        error: errorMsg
      })
      console.error(`❌ Failed: ${camera.name} - ${errorMsg}\n`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 REGISTRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Cameras: ${results.total}`)
  console.log(`✅ Success: ${results.success.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  
  if (results.failed.length > 0) {
    console.log('\nFailed Cameras:')
    results.failed.forEach(({ cameraId, error }) => {
      console.log(`  - ${cameraId}: ${error}`)
    })
  }

  // Group by warehouse
  const byWarehouse = cameras.reduce((acc, cam) => {
    if (!acc[cam.warehouseId]) {
      acc[cam.warehouseId] = []
    }
    acc[cam.warehouseId].push(cam.cameraId)
    return acc
  }, {} as Record<string, string[]>)

  console.log('\n📦 Cameras by Warehouse:')
  Object.entries(byWarehouse).forEach(([warehouse, cameraIds]) => {
    console.log(`  ${warehouse}: ${cameraIds.length} cameras`)
  })

  return results
}

// Run if executed directly
if (require.main === module) {
  registerCameras()
    .then(() => {
      console.log('\n✅ Registration complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Registration failed:', error)
      process.exit(1)
    })
}

export { registerCameras }














