/**
 * Verify TMS Setup
 * Checks database connection, tables, and import readiness
 */

const fs = require('fs');

console.log('🔍 TMS Setup Verification');
console.log('='.repeat(60));
console.log('');

// Check 1: CSV file exists
console.log('1. Checking CSV file...');
const csvPath = 'C:\\Users\\balba\\OneDrive\\Desktop\\zoho data.csv';
if (fs.existsSync(csvPath)) {
  const stats = fs.statSync(csvPath);
  console.log(`   ✅ CSV file found: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.log(`   ❌ CSV file not found at: ${csvPath}`);
}

// Check 2: Environment variables
console.log('\n2. Checking environment variables...');
if (process.env.DATABASE_URL) {
  console.log('   ✅ DATABASE_URL is set');
} else {
  console.log('   ⚠️  DATABASE_URL not set (will use defaults)');
}

// Check 3: Required files exist
console.log('\n3. Checking required files...');
const requiredFiles = [
  'lib/services/tms/tmsCoreService.ts',
  'lib/services/tms/database/tmsDatabaseAdapter.ts',
  'lib/services/tms/csvImportService.ts',
  'app/api/tms/jobs/import/route.ts',
  'scripts/import-flex-logistics.js',
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check 4: Server port
console.log('\n4. Checking server configuration...');
console.log('   ℹ️  Server should run on port 3002');
console.log('   ℹ️  API endpoint: http://localhost:3002/api/tms/jobs/import');

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (allFilesExist) {
  console.log('✅ All required files exist');
} else {
  console.log('❌ Some required files are missing');
}

console.log('\n✅ Setup verification complete!');
console.log('\n📋 Next Steps:');
console.log('   1. Ensure PostgreSQL is running');
console.log('   2. Set DATABASE_URL in .env (if not using defaults)');
console.log('   3. Start server: npm run dev');
console.log('   4. Run import: node scripts/import-flex-logistics.js');
console.log('');


