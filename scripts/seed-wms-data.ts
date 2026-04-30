
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const TENANT_ID = 'tenant-1' // Common default for development

    console.log('🌱 Starting WMS Seeding for Tenant:', TENANT_ID)

    // 1. Cleanup existing WMS data for this tenant to avoid conflicts
    // Order matters: Children first!
    await prisma.wMSShipmentLine.deleteMany({ where: { shipment: { tenantId: TENANT_ID } } })
    await prisma.wMSShipment.deleteMany({ where: { tenantId: TENANT_ID } })
    await prisma.inventoryQuant.deleteMany({ where: { tenantId: TENANT_ID } })
    await prisma.storageBin.deleteMany({ where: { area: { warehouse: { tenantId: TENANT_ID } } } })
    await prisma.warehouseArea.deleteMany({ where: { warehouse: { tenantId: TENANT_ID } } })
    await prisma.warehouse.deleteMany({ where: { tenantId: TENANT_ID } })
    await prisma.facility.deleteMany({ where: { tenantId: TENANT_ID } })

    console.log('🧹 Cleaned up old WMS data.')

    // 1.5 Create Facility
    const facility = await prisma.facility.create({
        data: {
            tenantId: TENANT_ID,
            name: 'Riyadh Main Facility',
            code: 'RYD-FAC-01',
            type: 'DISTRIBUTION_CENTER',
            city: 'Riyadh',
            country: 'Saudi Arabia'
        }
    })

    // 2. Create the Flagship Warehouse (Digital Twin)
    const warehouse = await prisma.warehouse.create({
        data: {
            tenantId: TENANT_ID,
            facilityId: facility.id,
            code: 'DXB-HUB-01',
            name: 'Riyadh Digital Logistics Hub',
            type: 'DISTRIBUTION',
            length: 100, // 100 meters
            width: 50,   // 50 meters
            height: 12,  // 12 meters
            location: { lat: 24.7136, lng: 46.6753 }, // Riyadh
        }
    })

    console.log(`🏭 Created Warehouse: ${warehouse.name} (${warehouse.id})`)

    // 3. Create Areas (The Logic Layer)
    const areas = await prisma.warehouseArea.createMany({
        data: [
            {
                warehouseId: warehouse.id,
                code: 'Z-REC',
                name: 'Receiving Area',
                zone: 'Zone A',
                type: 'RECEIVING',
                temperatureMin: 20,
                temperatureMax: 25
            },
            {
                warehouseId: warehouse.id,
                code: 'Z-MAIN',
                name: 'Main Storage',
                zone: 'Zone B',
                type: 'STORAGE',
                allowsHazmat: true,
                allowedHazards: ['3', '8'] // Flammable, Corrosive
            },
            {
                warehouseId: warehouse.id,
                code: 'Z-COLD',
                name: 'Pharma Cold Chain',
                zone: 'Zone C',
                type: 'COLD_STORAGE',
                temperatureMin: 2,
                temperatureMax: 8
            }
        ]
    })

    // Fetch back to get IDs
    const receivingArea = await prisma.warehouseArea.findFirst({
        where: { warehouseId: warehouse.id, code: 'Z-REC' }
    })
    const mainArea = await prisma.warehouseArea.findFirst({
        where: { warehouseId: warehouse.id, code: 'Z-MAIN' }
    })

    // 4. Create 3D Bins (The Spatial Layer)
    console.log('📦 Generating 3D Bins...')
    const bins = []

    if (mainArea) {
        // Generate 3 Aisles, 5 Racks, 4 Levels
        for (let aisle = 1; aisle <= 3; aisle++) {
            for (let rack = 1; rack <= 5; rack++) {
                for (let level = 1; level <= 4; level++) {
                    const aisleCode = `A${aisle.toString().padStart(2, '0')}`
                    const rackCode = `R${rack.toString().padStart(2, '0')}`
                    const levelCode = `L${level.toString().padStart(2, '0')}`
                    const posCode = `P01`
                    const binCode = `${aisleCode}-${rackCode}-${levelCode}-${posCode}`

                    bins.push({
                        areaId: mainArea.id,
                        code: binCode,
                        barcode: binCode,
                        level: level,
                        bay: rack,

                        // Real 3D Coordinates (Approximate mapping to new schema fields if needed, or just simplified)
                        length: 120,
                        width: 100,
                        height: 150,

                        maxWeight: 1000,
                        status: 'EMPTY',
                        type: 'SHELF'
                    })
                }
            }
        }

        await prisma.storageBin.createMany({ data: bins })
        console.log(`✅ Generated ${bins.length} Intelligent Storage Bins.`)
    }

    // 4.1 Setup Replenishment Scenario
    // Find a bin to be the "Pick Face"
    const pickBin = await prisma.storageBin.findFirst({ where: { code: 'A01-R01-L01-P01' } })
    // Find a bin to be the "Reserve"
    const reserveBin = await prisma.storageBin.findFirst({ where: { code: 'A01-R01-L04-P01' } }) // High up

    if (pickBin && reserveBin) {
        console.log('🔄 Setting up Replenishment Scenario...')
        const SKU = 'MAT-RPL-TEST'

        // 1. Configure Pick Bin (Low Stock)
        await prisma.storageBin.update({
            where: { id: pickBin.id },
            data: {
                minStock: 10,
                maxStock: 50,
                replenishmentSku: SKU
            }
        })

        // 2. Add some stock to Pick Bin (Below Min)
        await prisma.inventoryQuant.create({
            data: {
                tenantId: TENANT_ID,
                sku: SKU,
                quantity: 5, // < 10 (Trigger!)
                uom: 'EA',
                binId: pickBin.id,
                status: 'AVAILABLE'
            }
        })

        // 3. Add Reserve Stock (Plenty)
        await prisma.inventoryQuant.create({
            data: {
                tenantId: TENANT_ID,
                sku: SKU,
                quantity: 1000,
                uom: 'EA',
                binId: reserveBin.id,
                status: 'AVAILABLE'
            }
        })

        // Create Material Master for it
        await prisma.materialMaster.create({
            data: {
                tenantId: TENANT_ID,
                materialNumber: SKU,
                description: 'Replenishment Test Item',
                standardPrice: 100,
            }
        })
        console.log('✅ Replenishment Scenario Ready: Pick Bin has 5 (Min 10), Reserve has 1000.')
    }


    // 5. Create Sample Outbound Orders (WMSShipment)
    console.log('🚚 Generating Outbound Orders...')
    await prisma.wMSShipment.createMany({
        data: [
            {
                tenantId: TENANT_ID,
                shipmentNumber: 'ORD-2024-1001',
                status: 'CREATED',
                // New Order Fields
                orderNumber: 'SO-5001',
                customerName: 'Al-Futtaim Retail',
                destination: 'Jeddah Mall',
                expectedDeliveryDate: new Date('2024-12-30'),
                totalWeight: 1500,
                totalVolume: 12.5,
                carrier: 'DHL Supply Chain'
            },
            {
                tenantId: TENANT_ID,
                shipmentNumber: 'ORD-2024-1002',
                status: 'PICKING',
                orderNumber: 'SO-5002',
                customerName: 'Panda Hypermarket',
                destination: 'Riyadh Ring Road Branch',
                expectedDeliveryDate: new Date('2024-12-28'),
                totalWeight: 500,
                totalVolume: 4.2,
                carrier: 'NAQEL Express'
            }
        ]
    })
    console.log('✅ Generated Sample Outbound Orders.')

    console.log('🚀 WMS Seeding Complete! Real Data is Ready.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
