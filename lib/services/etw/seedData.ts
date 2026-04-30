/**
 * ETW Seed Data
 *
 * Creates 4 example ETWs:
 * 1. Local shipment
 * 2. Inter-city domestic (KSA)
 * 3. Cross-border shipment
 * 4. Multimodal shipment
 */

import { etwService } from "./etwService";
import { etwEventService } from "./eventService";
import { etwQRVerificationService } from "./qrVerificationService";
import type { CreateETWSchema } from "@/types/etw";
import { z } from "zod";

const CreateETWZodSchema = z.object({
  tenantId: z.string(),
  scope: z.enum(["LOCAL", "INTERCITY", "CROSS_BORDER", "MULTIMODAL"]),
  mode: z.enum([
    "AIR",
    "SEA",
    "LAND",
    "RAIL",
    "MULTIMODAL",
    "EXPRESS",
    "COURIER",
  ]),
  parties: z.array(z.any()).min(2),
  cargo: z.any(),
  compliance: z.any(),
  route: z.any(),
  commercial: z.any(),
  createdBy: z.string(),
});

export async function seedETWData(
  tenantId: string = "tenant-1",
  userId: string = "system",
): Promise<{
  success: boolean;
  message: string;
  etws: string[];
}> {
  const createdETWs: string[] = [];

  try {
    console.log("🚀 Seeding ETW Data...");

    // 1. Local Shipment (Riyadh to Riyadh)
    console.log("📦 Creating local shipment ETW...");
    const localETW = await etwService.create({
      tenantId,
      scope: "LOCAL",
      mode: "LAND",
      parties: [
        {
          id: "party-1",
          type: "SHIPPER",
          name: "ABC Trading Company",
          contact: {
            name: "Ahmed Al-Saud",
            phone: "+966501234567",
            email: "ahmed@abctrading.com",
            address: "Industrial Area, Riyadh, Saudi Arabia",
          },
        },
        {
          id: "party-2",
          type: "CONSIGNEE",
          name: "XYZ Distribution Center",
          contact: {
            name: "Fatima Al-Rashid",
            phone: "+966507654321",
            email: "fatima@xyzdist.com",
            address: "Al-Malaz, Riyadh, Saudi Arabia",
          },
        },
        {
          id: "party-3",
          type: "CARRIER",
          name: "Fast Logistics Co.",
          contact: {
            name: "Mohammed Driver",
            phone: "+966509876543",
            email: "driver@fastlog.com",
            address: "Riyadh, Saudi Arabia",
          },
        },
      ],
      cargo: {
        items: [
          {
            id: "item-1",
            description: "Electronics - Mobile Phones",
            packaging: {
              type: "Carton",
              quantity: 50,
              unit: "pcs",
            },
            weight: {
              gross: 500,
              net: 480,
              unit: "KG",
            },
            value: {
              amount: 250000,
              currency: "SAR",
            },
          },
        ],
        totalWeight: 500,
        totalValue: 250000,
        currency: "SAR",
        totalPieces: 50,
      },
      compliance: {
        hazardous: false,
      },
      route: {
        origin: {
          id: "loc-1",
          name: "ABC Trading Warehouse",
          type: "WAREHOUSE",
          address: {
            street: "Industrial Area, Block 5",
            city: "Riyadh",
            postalCode: "12345",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        destination: {
          id: "loc-2",
          name: "XYZ Distribution Center",
          type: "WAREHOUSE",
          address: {
            street: "Al-Malaz District",
            city: "Riyadh",
            postalCode: "12613",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        mode: "LAND",
      },
      commercial: {
        contractType: "CONTRACT",
        rate: {
          base: 5000,
          currency: "SAR",
          total: 5000,
        },
      },
      createdBy: userId,
    });
    createdETWs.push(localETW.id);
    console.log(`   ✅ Local ETW created: ${localETW.etwNumber}`);

    // Add events for local ETW
    await etwEventService.addEvent({
      etwId: localETW.id,
      type: "PICKED_UP",
      actor: {
        id: userId,
        name: "Mohammed Driver",
        role: "DRIVER",
        type: "DRIVER",
      },
      location: {
        name: "ABC Trading Warehouse",
        coordinates: { lat: 24.7136, lng: 46.6753 },
      },
      verificationMethod: "GPS",
    });

    await etwEventService.addEvent({
      etwId: localETW.id,
      type: "IN_TRANSIT",
      actor: {
        id: userId,
        name: "Mohammed Driver",
        role: "DRIVER",
        type: "DRIVER",
      },
      location: {
        name: "In Transit - Riyadh",
        coordinates: { lat: 24.7136, lng: 46.6753 },
      },
      verificationMethod: "GPS",
    });

    // 2. Inter-city Domestic (Riyadh to Jeddah)
    console.log("📦 Creating inter-city ETW...");
    const intercityETW = await etwService.create({
      tenantId,
      scope: "INTERCITY",
      mode: "LAND",
      parties: [
        {
          id: "party-4",
          type: "SHIPPER",
          name: "Saudi Manufacturing Co.",
          contact: {
            name: "Khalid Al-Mansouri",
            phone: "+966501111111",
            email: "khalid@saudimfg.com",
            address: "Riyadh, Saudi Arabia",
          },
        },
        {
          id: "party-5",
          type: "CONSIGNEE",
          name: "Jeddah Port Authority",
          contact: {
            name: "Sara Al-Harbi",
            phone: "+966502222222",
            email: "sara@jeddahport.com",
            address: "Jeddah, Saudi Arabia",
          },
        },
        {
          id: "party-6",
          type: "CARRIER",
          name: "National Transport Co.",
          contact: {
            name: "Omar Driver",
            phone: "+966503333333",
            email: "omar@nationaltrans.com",
            address: "Riyadh, Saudi Arabia",
          },
        },
      ],
      cargo: {
        items: [
          {
            id: "item-2",
            description: "Machinery Parts",
            packaging: {
              type: "Pallet",
              quantity: 20,
              unit: "pallets",
            },
            weight: {
              gross: 5000,
              net: 4800,
              unit: "KG",
            },
            value: {
              amount: 500000,
              currency: "SAR",
            },
          },
        ],
        totalWeight: 5000,
        totalValue: 500000,
        currency: "SAR",
        totalPieces: 20,
      },
      compliance: {
        hazardous: false,
      },
      route: {
        origin: {
          id: "loc-3",
          name: "Saudi Manufacturing Warehouse",
          type: "WAREHOUSE",
          address: {
            street: "Industrial City, Riyadh",
            city: "Riyadh",
            postalCode: "12345",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        destination: {
          id: "loc-4",
          name: "Jeddah Port",
          type: "PORT",
          address: {
            street: "Jeddah Islamic Port",
            city: "Jeddah",
            postalCode: "21461",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        mode: "LAND",
      },
      commercial: {
        contractType: "CONTRACT",
        rate: {
          base: 15000,
          currency: "SAR",
          total: 15000,
        },
      },
      createdBy: userId,
    });
    createdETWs.push(intercityETW.id);
    console.log(`   ✅ Inter-city ETW created: ${intercityETW.etwNumber}`);

    // 3. Cross-border Shipment (KSA to UAE)
    console.log("📦 Creating cross-border ETW...");
    const crossBorderETW = await etwService.create({
      tenantId,
      scope: "CROSS_BORDER",
      mode: "LAND",
      parties: [
        {
          id: "party-7",
          type: "SHIPPER",
          name: "Gulf Export Company",
          contact: {
            name: "Yusuf Al-Ghamdi",
            phone: "+966504444444",
            email: "yusuf@gulfexport.com",
            address: "Dammam, Saudi Arabia",
          },
        },
        {
          id: "party-8",
          type: "CONSIGNEE",
          name: "Dubai Trading LLC",
          contact: {
            name: "Ali Al-Mazrouei",
            phone: "+971501111111",
            email: "ali@dubaitrading.ae",
            address: "Dubai, UAE",
          },
        },
        {
          id: "party-9",
          type: "CARRIER",
          name: "International Freight Co.",
          contact: {
            name: "Hassan Driver",
            phone: "+966505555555",
            email: "hassan@intlfreight.com",
            address: "Dammam, Saudi Arabia",
          },
        },
        {
          id: "party-10",
          type: "BROKER",
          name: "Customs Broker Services",
          contact: {
            name: "Nasser Broker",
            phone: "+966506666666",
            email: "nasser@customsbroker.com",
            address: "Dammam, Saudi Arabia",
          },
        },
      ],
      cargo: {
        items: [
          {
            id: "item-3",
            description: "Textiles - Fabric Rolls",
            hsCode: "5208.11",
            packaging: {
              type: "Roll",
              quantity: 100,
              unit: "rolls",
            },
            weight: {
              gross: 3000,
              net: 2900,
              unit: "KG",
            },
            value: {
              amount: 750000,
              currency: "SAR",
            },
          },
        ],
        totalWeight: 3000,
        totalValue: 750000,
        currency: "SAR",
        totalPieces: 100,
      },
      compliance: {
        hazardous: false,
        incoterms: "FOB",
        exportLicense: "EXP-2025-001",
      },
      route: {
        origin: {
          id: "loc-5",
          name: "Dammam Port",
          type: "PORT",
          address: {
            street: "King Fahd Port",
            city: "Dammam",
            postalCode: "32245",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        destination: {
          id: "loc-6",
          name: "Dubai Port",
          type: "PORT",
          address: {
            street: "Jebel Ali Port",
            city: "Dubai",
            postalCode: "00000",
            country: "United Arab Emirates",
            countryCode: "AE",
          },
        },
        borders: ["Saudi-UAE Border"],
        mode: "LAND",
      },
      commercial: {
        contractType: "CONTRACT",
        rate: {
          base: 25000,
          currency: "SAR",
          total: 25000,
        },
      },
      createdBy: userId,
    });
    createdETWs.push(crossBorderETW.id);
    console.log(`   ✅ Cross-border ETW created: ${crossBorderETW.etwNumber}`);

    // Add border crossing event
    await etwEventService.addEvent({
      etwId: crossBorderETW.id,
      type: "BORDER_CROSSING",
      actor: {
        id: userId,
        name: "Hassan Driver",
        role: "DRIVER",
        type: "DRIVER",
      },
      location: {
        name: "Saudi-UAE Border",
        coordinates: { lat: 25.0, lng: 55.0 },
      },
      verificationMethod: "GPS",
    });

    // 4. Multimodal Shipment (Road + Sea)
    console.log("📦 Creating multimodal ETW...");
    const multimodalETW = await etwService.create({
      tenantId,
      scope: "MULTIMODAL",
      mode: "MULTIMODAL",
      parties: [
        {
          id: "party-11",
          type: "SHIPPER",
          name: "Global Logistics Inc.",
          contact: {
            name: "Majed Al-Otaibi",
            phone: "+966507777777",
            email: "majed@globallog.com",
            address: "Riyadh, Saudi Arabia",
          },
        },
        {
          id: "party-12",
          type: "CONSIGNEE",
          name: "European Import Co.",
          contact: {
            name: "John Smith",
            phone: "+33123456789",
            email: "john@euroimport.com",
            address: "Rotterdam, Netherlands",
          },
        },
        {
          id: "party-13",
          type: "CARRIER",
          name: "Multimodal Transport Co.",
          contact: {
            name: "Transport Coordinator",
            phone: "+966508888888",
            email: "coord@multimodal.com",
            address: "Riyadh, Saudi Arabia",
          },
        },
      ],
      cargo: {
        items: [
          {
            id: "item-4",
            description: "Automotive Parts",
            packaging: {
              type: "Container",
              quantity: 1,
              unit: "container",
            },
            weight: {
              gross: 20000,
              net: 19500,
              unit: "KG",
            },
            containerNumber: "CONT-123456",
            sealNumbers: ["SEAL-001", "SEAL-002"],
            value: {
              amount: 2000000,
              currency: "SAR",
            },
          },
        ],
        totalWeight: 20000,
        totalContainers: 1,
        totalValue: 2000000,
        currency: "SAR",
        totalPieces: 1,
      },
      compliance: {
        hazardous: false,
        incoterms: "CIF",
      },
      route: {
        origin: {
          id: "loc-7",
          name: "Riyadh Warehouse",
          type: "WAREHOUSE",
          address: {
            street: "Industrial Area",
            city: "Riyadh",
            postalCode: "12345",
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        },
        destination: {
          id: "loc-8",
          name: "Rotterdam Port",
          type: "PORT",
          address: {
            street: "Rotterdam Port",
            city: "Rotterdam",
            postalCode: "3011",
            country: "Netherlands",
            countryCode: "NL",
          },
        },
        ports: ["Jeddah Port", "Rotterdam Port"],
        mode: "MULTIMODAL",
      },
      commercial: {
        contractType: "CONTRACT",
        rate: {
          base: 50000,
          currency: "SAR",
          total: 50000,
        },
      },
      createdBy: userId,
    });
    createdETWs.push(multimodalETW.id);
    console.log(`   ✅ Multimodal ETW created: ${multimodalETW.etwNumber}`);

    // Add multimodal legs
    // Note: Legs would be created via a separate service, but for seed data we'll add events
    await etwEventService.addEvent({
      etwId: multimodalETW.id,
      type: "PICKED_UP",
      actor: {
        id: userId,
        name: "Road Transport Driver",
        role: "DRIVER",
        type: "DRIVER",
      },
      location: {
        name: "Riyadh Warehouse",
        coordinates: { lat: 24.7136, lng: 46.6753 },
      },
      verificationMethod: "GPS",
    });

    await etwEventService.addEvent({
      etwId: multimodalETW.id,
      type: "HANDOVER",
      actor: {
        id: userId,
        name: "Port Operator",
        role: "OPERATOR",
        type: "USER",
      },
      location: {
        name: "Jeddah Port",
        coordinates: { lat: 21.4858, lng: 39.1925 },
      },
      handoverTo: {
        id: "sea-carrier",
        name: "Sea Freight Carrier",
        role: "CARRIER",
      },
      verificationMethod: "SIGNATURE",
    });

    // Generate QR codes for all ETWs
    console.log("📱 Generating QR codes...");
    for (const etwId of createdETWs) {
      try {
        await etwQRVerificationService.generateQR(etwId, tenantId, userId, {
          accessPolicy: "CUSTOMER",
          expiresInDays: 365,
        });
        console.log(`   ✅ QR generated for ETW: ${etwId}`);
      } catch (error) {
        // QR generation might fail if ETW doesn't have all required data
        // This is OK for seed data - QR can be generated later
        console.warn(
          `   ⚠️  Failed to generate QR for ${etwId}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log("");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("✅ ETW SEED DATA COMPLETE");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(`   📦 ETWs Created: ${createdETWs.length}`);
    console.log(`   📋 Local: ${localETW.etwNumber}`);
    console.log(`   📋 Inter-city: ${intercityETW.etwNumber}`);
    console.log(`   📋 Cross-border: ${crossBorderETW.etwNumber}`);
    console.log(`   📋 Multimodal: ${multimodalETW.etwNumber}`);
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("");

    return {
      success: true,
      message: `Successfully created ${createdETWs.length} ETWs`,
      etws: createdETWs,
    };
  } catch (error) {
    console.error("❌ Error seeding ETW data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      etws: createdETWs,
    };
  }
}
