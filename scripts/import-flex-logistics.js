/**
 * Simple Flex Logistics CSV Import Script
 * Uses the API endpoint - no TypeScript compilation needed
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const CSV_FILE_PATH = 'C:\\Users\\balba\\OneDrive\\Desktop\\zoho data.csv';
const API_URL = 'http://localhost:3002/api/tms/jobs/import';
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
    const fileStats = fs.statSync(CSV_FILE_PATH);
    const fileSize = (fileStats.size / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSize} KB`);

    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const lineCount = csvContent.split('\n').length;
    console.log(`📝 File lines: ${lineCount} lines\n`);

    console.log('🔄 Importing jobs via API...');
    console.log(`   API: ${API_URL}`);
    console.log(`   Tenant: ${FLEX_LOGISTICS_TENANT_ID}`);
    console.log(`   Created by: ${SYSTEM_USER_ID}\n`);

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_FILE_PATH), {
      filename: 'zoho data.csv',
      contentType: 'text/csv',
    });
    formData.append('tenantId', FLEX_LOGISTICS_TENANT_ID);
    formData.append('createdBy', SYSTEM_USER_ID);

    // Make API call
    console.log('📤 Sending import request...\n');
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      console.log('\n💡 Make sure:');
      console.log('   1. The development server is running (npm run dev)');
      console.log('   2. The API endpoint is accessible');
      process.exit(1);
    }

    const result = await response.json();

    // Display results
    console.log('='.repeat(60));
    console.log('📊 IMPORT RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`📥 Imported: ${result.imported || 0} jobs`);
    console.log(`❌ Failed: ${result.failed || 0} jobs`);
    console.log(`📋 Total Processed: ${(result.imported || 0) + (result.failed || 0)} jobs\n`);

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
      console.log(`   • ${result.imported || 0} jobs imported`);
      console.log(`   • ${result.failed || 0} jobs failed`);
      if ((result.imported || 0) + (result.failed || 0) > 0) {
        const successRate = (((result.imported || 0) / ((result.imported || 0) + (result.failed || 0))) * 100).toFixed(1);
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
    if (error.message) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(error);
    }
    console.log('\n💡 Make sure:');
    console.log('   1. The development server is running (npm run dev)');
    console.log('   2. The CSV file exists at the specified path');
    console.log('   3. You have proper permissions to read the file');
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


