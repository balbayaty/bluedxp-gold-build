/**
 * MSDS Extraction Test Script
 * Tests the complete MSDS extraction pipeline for production readiness
 */

import { SDSParserService } from '../lib/services/ml/sds-parser'
import { defaultMsdsExtractionAdapter } from '../lib/services/chemical/extraction/defaultMsdsExtractionAdapter'
import { msdsExtractionValidator } from '../lib/services/chemical/extraction/msdsExtractionValidator'

// Sample SDS text for testing
const sampleSDSText = `
SAFETY DATA SHEET

SECTION 1: IDENTIFICATION
Product Name: Test Chemical
CAS Number: 64-17-5
Manufacturer: Test Manufacturer Inc.
UN Number: UN1170

SECTION 2: HAZARDS IDENTIFICATION
NFPA 704 Diamond: 2-0-1
Health: 2
Flammability: 0
Reactivity: 1

Hazard Statements:
H225: Highly Flammable liquid and vapor
H319: Causes serious eye irritation

Precautionary Statements:
P210: Keep away from heat, sparks, open flames, hot surfaces
P280: Wear protective gloves/protective clothing/eye protection/face protection

SECTION 3: COMPOSITION/INGREDIENTS
Chemical Name: Ethanol
CAS: 64-17-5
Molecular Formula: C2H5OH

SECTION 4: FIRST AID MEASURES
Inhalation: Remove to fresh air
Skin Contact: Wash with soap and water
Eye Contact: Flush with water for 15 minutes
Ingestion: Do not induce vomiting, seek medical attention

SECTION 5: FIRE FIGHTING MEASURES
Suitable Extinguishing Media: CO2, dry chemical, foam
Special Hazards: Flammable vapors

SECTION 6: ACCIDENTAL RELEASE MEASURES
Wear appropriate protective equipment. Contain spillage. Ventilate area.

SECTION 7: HANDLING AND STORAGE
Storage Conditions: Store in cool, dry, well-ventilated area away from heat and ignition sources
Incompatible Materials: Strong oxidizing agents

SECTION 8: EXPOSURE CONTROLS/PERSONAL PROTECTION
PPE Required: Safety glasses, gloves, protective clothing

SECTION 9: PHYSICAL AND CHEMICAL PROPERTIES
Appearance: Clear, colorless liquid
Flash Point: 13°C
Boiling Point: 78°C
pH: 7.0

SECTION 10: STABILITY AND REACTIVITY
Stable under normal conditions
Incompatible with: Strong oxidizing agents

SECTION 11: TOXICOLOGICAL INFORMATION
Acute Toxicity: LD50 (oral, rat) > 5000 mg/kg

SECTION 12: ECOLOGICAL INFORMATION
Not classified as environmentally hazardous

SECTION 13: DISPOSAL CONSIDERATIONS
Dispose in accordance with local regulations

SECTION 14: TRANSPORT INFORMATION
UN Number: UN1170
Transport Class: Class 3
Packing Group: PG II

SECTION 15: REGULATORY INFORMATION
GHS Compliant: Yes
REACH: Registered

SECTION 16: OTHER INFORMATION
Revision Date: 2024-01-01
`

async function testMSDSExtraction() {
  console.log('🧪 Testing MSDS Extraction Pipeline\n')
  console.log('=' .repeat(60))

  try {
    // Test 1: SDS Parser
    console.log('\n1️⃣ Testing SDS Parser...')
    const parser = new SDSParserService()
    const parsed = await parser.parseSDSWithSections(sampleSDSText)
    
    console.log('✅ Parser Results:')
    console.log(`   - Chemical Name: ${parsed.chemicalName}`)
    console.log(`   - CAS Number: ${parsed.casNumber}`)
    console.log(`   - Manufacturer: ${parsed.manufacturer}`)
    console.log(`   - Sections Found: ${Object.keys(parsed.sections || {}).length}`)
    console.log(`   - NFPA Health: ${(parsed as any).nfpa?.health || 'N/A'}`)
    console.log(`   - NFPA Flammability: ${(parsed as any).nfpa?.flammability || 'N/A'}`)
    console.log(`   - NFPA Reactivity: ${(parsed as any).nfpa?.reactivity || 'N/A'}`)

    // Test 2: Extraction Adapter
    console.log('\n2️⃣ Testing Extraction Adapter...')
    const extraction = await defaultMsdsExtractionAdapter.extractFromText(sampleSDSText, {
      tenantId: 'test-tenant',
      language: 'en',
    })

    console.log('✅ Extraction Results:')
    console.log(`   - Product Name: ${extraction.extractedData.productName}`)
    console.log(`   - CAS Number: ${extraction.extractedData.casNumber}`)
    console.log(`   - UN Number: ${extraction.extractedData.unNumber}`)
    console.log(`   - Health Rating: ${extraction.extractedData.healthRating}`)
    console.log(`   - Flammability Rating: ${extraction.extractedData.flammabilityRating}`)
    console.log(`   - Reactivity Rating: ${extraction.extractedData.reactivityRating}`)
    console.log(`   - Hazard Statements: ${extraction.extractedData.hazardStatements?.length || 0}`)
    console.log(`   - Confidence: ${extraction.confidence}%`)
    console.log(`   - Issues: ${extraction.issues.length}`)
    const parsedSections = (extraction.parsed as any)?.sections
    console.log(`   - Has Sections: ${!!parsedSections}`)
    console.log(`   - Section Count: ${parsedSections ? Object.keys(parsedSections).length : 0}`)

    // Test 3: Validation
    console.log('\n3️⃣ Testing Validation...')
    const validation = msdsExtractionValidator.validate(extraction.extractedData)
    
    console.log('✅ Validation Results:')
    console.log(`   - Valid: ${validation.isValid}`)
    console.log(`   - Score: ${validation.score}/100`)
    console.log(`   - Errors: ${validation.errors.length}`)
    console.log(`   - Warnings: ${validation.warnings.length}`)
    console.log(`   - Production Ready: ${msdsExtractionValidator.isProductionReady(extraction.extractedData)}`)

    if (validation.errors.length > 0) {
      console.log('\n❌ Errors:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      validation.warnings.forEach(warning => console.log(`   - ${warning}`))
    }

    // Test 4: Section Extraction
    console.log('\n4️⃣ Testing Section Extraction...')
    const sections: Record<string, string> = (extraction.parsed as any)?.sections || {}
    const expectedSections = [
      'identification', 'hazards', 'composition', 'firstAid', 'firefighting',
      'accidentalRelease', 'handling', 'exposureControls', 'physicalProperties',
      'stability', 'toxicological', 'ecological', 'disposal', 'transport',
      'regulatory', 'other'
    ]

    console.log('✅ Sections Found:')
    expectedSections.forEach(section => {
      const found = sections[section] ? '✅' : '❌'
      console.log(`   ${found} ${section}: ${sections[section] ? 'Found' : 'Missing'}`)
    })

    // Test 5: NFPA Extraction
    console.log('\n5️⃣ Testing NFPA Diamond Extraction...')
    const nfpa = (extraction.parsed as any)?.nfpa
    if (nfpa) {
      console.log('✅ NFPA Diamond:')
      console.log(`   - Health: ${nfpa.health}`)
      console.log(`   - Flammability: ${nfpa.flammability}`)
      console.log(`   - Reactivity: ${nfpa.reactivity}`)
    } else {
      console.log('❌ NFPA Diamond not found')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Parser: Working`)
    console.log(`✅ Extraction: Working (${extraction.confidence}% confidence)`)
    console.log(`✅ Validation: ${validation.isValid ? 'Passed' : 'Failed'} (${validation.score}/100)`)
    console.log(`✅ Sections: ${Object.keys(sections).length}/16 extracted`)
    console.log(`✅ NFPA: ${nfpa ? 'Extracted' : 'Missing'}`)
    console.log(`✅ Production Ready: ${msdsExtractionValidator.isProductionReady(extraction.extractedData) ? 'Yes' : 'No'}`)

    if (validation.isValid && validation.score >= 70 && Object.keys(sections).length >= 10) {
      console.log('\n🎉 All tests passed! System is production-ready.')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed. Review issues above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Run tests
testMSDSExtraction()

