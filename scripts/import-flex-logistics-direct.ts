/**
 * Direct Flex Logistics CSV Import
 * Imports directly without requiring server
 */

import * as fs from 'fs';
import * as path from 'path';

// Use require for direct import
const csvImportService = require('../lib/services/tms/csvImportService').csvImportService;
const tmsCoreService = require('../lib/services/tms/tmsCoreService').tmsCoreService;

const CSV_FILE_PATH = 'C:\\Users\\balba\\OneDrive\\Desktop\\zoho data.csv';
const FLEX_LOGISTICS_TENANT_ID = 'flex-logistics';
const SYSTEM_USER_ID = 'system-import';

async function importData() {
  try {
    console.log('🚀 Flex Logistics TMS Data Import');
    console.log('='.repeat(60));
    console.log('');

    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ Error: CSV file not found at: ${CSV_FILE_PATH}`);
      console.log('\nPlease check the file path and try again.');
      process.exit(1);
    }

    console.log(`📄 Reading CSV file: ${CSV_FILE_PATH}`);
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    
    const fileStats = fs.statSync(CSV_FILE_PATH);
    const fileSize = (fileStats.size / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSize} KB`);
    
    const lineCount = csvContent.split('\n').length;
    console.log(`📝 File lines: ${lineCount} lines\n`);

    console.log('🔄 Importing jobs into TMS...');
    console.log(`   Tenant: ${FLEX_LOGISTICS_TENANT_ID}`);
    console.log(`   Created by: ${SYSTEM_USER_ID}\n`);

    // Import using the service
    const result = await tmsCoreService.importJobsFromCSV(
      csvContent,
      FLEX_LOGISTICS_TENANT_ID,
      SYSTEM_USER_ID
    );

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`📥 Imported: ${result.imported} jobs`);
    console.log(`❌ Failed: ${result.failed} jobs`);
    console.log(`📋 Total Processed: ${result.imported + result.failed} jobs\n`);

    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  ERRORS FOUND:');
      console.log('-'.repeat(60));
      const errorCount = Math.min(result.errors.length, 20);
      for (let i = 0; i < errorCount; i++) {
        const error = result.errors[i];
        console.log(`Row ${error.row}: ${error.error}`);
      }
      if (result.errors.length > 20) {
        console.log(`\n... and ${result.errors.length - 20} more errors`);
      }
      console.log('');
    }

    if (result.jobIds && result.jobIds.length > 0) {
      console.log('✅ SUCCESSFULLY IMPORTED JOBS:');
      console.log('-'.repeat(60));
      const displayCount = Math.min(result.jobIds.length, 10);
      for (let i = 0; i < displayCount; i++) {
        console.log(`   ${i + 1}. ${result.jobIds[i]}`);
      }
      if (result.jobIds.length > 10) {
        console.log(`   ... and ${result.jobIds.length - 10} more jobs`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('\n🎉 Import completed successfully!');
      console.log(`\n📊 Summary:`);
      console.log(`   • ${result.imported} jobs imported`);
      console.log(`   • ${result.failed} jobs failed`);
      if (result.imported + result.failed > 0) {
        const successRate = ((result.imported / (result.imported + result.failed)) * 100).toFixed(1);
        console.log(`   • Success rate: ${successRate}%`);
      }
      console.log('\n✅ You can now:');
      console.log('   1. View jobs at: http://localhost:3002/tms/jobs');
      console.log('   2. View dashboard at: http://localhost:3002/tms');
      console.log('   3. Check analytics at: http://localhost:3002/tms/analytics');
    } else {
      console.log('\n⚠️  Import completed with errors.');
      console.log('   Please review the errors above and fix any issues.');
    }

    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Import failed with error:');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the import
importData()
  .then(() => {
    console.log('✅ Import process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  });


