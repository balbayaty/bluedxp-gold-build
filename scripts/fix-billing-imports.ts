/**
 * Fix Billing Component Imports
 * 
 * This script verifies all billing component imports are correct
 */

import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'components', 'billing');
const files = [
  'UnifiedBillingDashboard.tsx',
  'AddCreditsModal.tsx',
  'AddPaymentMethodModal.tsx',
  'EmployeeInvitationModal.tsx',
];

console.log('🔍 Checking billing component imports...\n');

let hasErrors = false;

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${file}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for export default
  if (!content.includes('export default')) {
    console.error(`❌ ${file}: Missing 'export default'`);
    hasErrors = true;
  } else {
    console.log(`✅ ${file}: Has export default`);
  }

  // Check for Modal import in EmployeeInvitationModal
  if (file === 'EmployeeInvitationModal.tsx') {
    if (content.includes('import Modal from "@/components/Modal"')) {
      console.log(`✅ ${file}: Modal import correct`);
    } else if (content.includes('import Modal from "@/components/ui/Modal"')) {
      console.warn(`⚠️  ${file}: Using old Modal import path`);
      hasErrors = true;
    } else {
      console.error(`❌ ${file}: Modal import not found`);
      hasErrors = true;
    }
  }
});

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Some issues found. Please fix them.');
  process.exit(1);
} else {
  console.log('✅ All imports look good!');
  process.exit(0);
}
