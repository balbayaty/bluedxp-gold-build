/**
 * Flex Logistics CSV Import Script
 * Helper script to import Zoho CSV data into TMS
 * 
 * Usage:
 *   npx ts-node scripts/import-flex-logistics-csv.ts <path-to-csv-file>
 */

import * as fs from 'fs';
import * as path from 'path';
import { tmsCoreService } from '../lib/services/tms/tmsCoreService';

const FLEX_LOGISTICS_TENANT_ID = 'flex-logistics';
const SYSTEM_USER_ID = 'system-import';

async function importCSV(csvFilePath: string) {
  try {
    console.log(`Reading CSV file: ${csvFilePath}`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    console.log('Importing jobs into TMS...');
    console.log(`Tenant: ${FLEX_LOGISTICS_TENANT_ID}`);
    console.log(`Created by: ${SYSTEM_USER_ID}`);
    
    // Import jobs
    const result = await tmsCoreService.importJobsFromCSV(
      csvContent,
      FLEX_LOGISTICS_TENANT_ID,
      SYSTEM_USER_ID
    );
    
    // Print results
    console.log('\n=== Import Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Imported: ${result.imported} jobs`);
    console.log(`Failed: ${result.failed} jobs`);
    
    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. Row ${error.row}: ${error.error}`);
      });
    }
    
    if (result.jobIds.length > 0) {
      console.log(`\n=== Imported Job IDs (first 10) ===`);
      result.jobIds.slice(0, 10).forEach((jobId, index) => {
        console.log(`${index + 1}. ${jobId}`);
      });
      if (result.jobIds.length > 10) {
        console.log(`... and ${result.jobIds.length - 10} more`);
      }
    }
    
    console.log('\n✅ Import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Main execution
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Usage: npx ts-node scripts/import-flex-logistics-csv.ts <path-to-csv-file>');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

importCSV(csvFilePath);


