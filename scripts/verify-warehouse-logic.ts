
import { PrismaClient } from '@prisma/client'
import { warehouseAssignmentService } from '../lib/services/warehouse-assignment'
import { facilityService } from '../lib/services/wms/facilityService'
import { warehouseAreaService } from '../lib/services/wms/areaService'
import { binService } from '../lib/services/wms/binService'

const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING VERIFICATION ---')

    // 1. Cleanup
    console.log('Cleaning up old test data...')
    await prisma.storageBin.deleteMany({})
    await prisma.warehouseArea.deleteMany({})
    await prisma.warehouse.deleteMany({})
    await prisma.facility.deleteMany({})

    // 2. Create Facility (Hazmat Certified)
    console.log('Creating Facility...')
    const facility = await facilityService.createFacility({
        tenantId: 'test-tenant',
        name: 'Jebel Ali Hazmat Hub',
        code: 'DXB-01',
        type: 'HAZMAT_STORAGE',
        countryCode: 'AE',
        city: 'Dubai',
        complianceStatus: 'Compliant',
        fireSuppressionType: 'Foam',
        civilDefenseLicense: 'CD-2024-XP99'
    }) as any
    console.log('Facility Created:', facility.id)

    // 3. Create Warehouse
    console.log('Creating Warehouse...')
    const warehouse = await prisma.warehouse.create({
        data: {
            tenantId: 'test-tenant',
            facilityId: facility.id,
            code: 'WH-CHEM-01',
            name: 'Chemical Warehouse 1',
            type: 'DISTRIBUTION'
        }
    })
    console.log('Warehouse Created:', warehouse.id)

    // 4. Create Areas (One Compatible, One Incompatible)
    console.log('Creating Areas...')

    // Area A: Flammable Liquids (Class 3) - OK
    const areaA = await warehouseAreaService.createArea({
        warehouseId: warehouse.id,
        areaCode: 'Z-FLAM',
        areaName: 'Flammable Storage',
        zone: 'Zone A',
        capacity: 1000,
        allowedHazards: ['Class 3', 'Class 4.1'],
        tempZone: 'AMBIENT'
    }) as any

    // Area B: Corrosives (Class 8) - No Class 3 allowed
    const areaB = await warehouseAreaService.createArea({
        warehouseId: warehouse.id,
        areaCode: 'Z-CORR',
        areaName: 'Corrosive Storage',
        zone: 'Zone B',
        capacity: 1000,
        allowedHazards: ['Class 8'],
        tempZone: 'AMBIENT'
    }) as any

    console.log('Areas Created')

    // 5. Test Recommendation Logic
    console.log('Testing Recommendation Logic for Class 3 (Flammable)...')
    const reqs = {
        hazardClass: 'Class 3',
        temperatureControlled: false,
        estimatedMonthlyVolume: 10
    }

    const recommendations = await warehouseAssignmentService.getWarehouseRecommendations(reqs)

    console.log(`Found ${recommendations.length} recommendations`)

    if (recommendations.length > 0) {
        console.log('Top Recommendation:', recommendations[0].warehouseName)
        console.log('Score:', recommendations[0].score)
        console.log('Matching Areas:', recommendations[0].matchingAreas)

        if (recommendations[0].matchingAreas.includes('Flammable Storage') &&
            !recommendations[0].matchingAreas.includes('Corrosive Storage')) {
            console.log('✅ SUCCESS: Correctly identified compatible area')
        } else {
            console.log('❌ FAILURE: Incorrect area selection')
        }
    } else {
        console.log('❌ FAILURE: No recommendations found')
    }

    // 6. Test Shelf Logic (Optional)
    console.log('Testing Bin Creation...')
    await binService.generateBinsForAisle(areaA.id, {
        aisle: 'A',
        bays: 2,
        levels: 2
    })
    const bins = await binService.listBins({ areaId: areaA.id })
    console.log(`Created ${bins.length} bins in Area A`)

    console.log('--- VERIFICATION COMPLETE ---')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
