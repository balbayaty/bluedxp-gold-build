const fs = require('fs');
const path = require('path');

// Icon mapping from React component to CSS class
const iconMap = {
  'RiShieldCheckLine': 'ri-shield-check-line',
  'RiFileAddLine': 'ri-file-add-line',
  'RiFileListLine': 'ri-file-list-line',
  'RiCalculatorLine': 'ri-calculator-line',
  'RiFlowChart': 'ri-flow-chart-line',
  'RiSearchLine': 'ri-search-line',
  'RiFilterLine': 'ri-filter-line',
  'RiDownloadLine': 'ri-download-line',
  'RiEyeLine': 'ri-eye-line',
  'RiEditLine': 'ri-edit-line',
  'RiDeleteLine': 'ri-delete-line',
  'RiSaveLine': 'ri-save-line',
  'RiArrowLeftLine': 'ri-arrow-left-line',
  'RiInformationLine': 'ri-information-line',
  'RiFileCertificateLine': 'ri-file-certificate-line',
  'RiAlertLine': 'ri-alert-line',
  'RiFileTextLine': 'ri-file-text-line',
  'RiFileSearchLine': 'ri-file-search-line',
  'RiMedicineBottleLine': 'ri-medicine-bottle-line',
  'RiRestaurantLine': 'ri-restaurant-line',
  'RiCheckboxCircleLine': 'ri-checkbox-circle-line',
  'RiTimeLine': 'ri-time-line',
};

const files = [
  'app/trade-compliance/civil-defense/page.tsx',
  'app/trade-compliance/sfda/page.tsx',
  'app/trade-compliance/landed-costs/page.tsx',
  'app/trade-compliance/process-flows/page.tsx',
];

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Remove remixicon-react import
  const importPattern = /import\s+\{[^}]*\}\s+from\s+['"]remixicon-react['"];?\n/g;
  if (importPattern.test(content)) {
    content = content.replace(importPattern, '');
    modified = true;
  }
  
  // Replace React component usages with CSS classes
  Object.entries(iconMap).forEach(([component, cssClass]) => {
    // Replace <ComponentName className="..." />
    const componentPattern1 = new RegExp(`<${component}\\s+className="([^"]*)"\\s*/>`, 'g');
    if (componentPattern1.test(content)) {
      content = content.replace(componentPattern1, `<i className="${cssClass} $1"></i>`);
      modified = true;
    }
    
    // Replace <ComponentName />
    const componentPattern2 = new RegExp(`<${component}\\s*/>`, 'g');
    if (componentPattern2.test(content)) {
      content = content.replace(componentPattern2, `<i className="${cssClass}"></i>`);
      modified = true;
    }
    
    // Replace <ComponentName>content</ComponentName>
    const componentPattern3 = new RegExp(`<${component}([^>]*)>([^<]*)</${component}>`, 'g');
    if (componentPattern3.test(content)) {
      content = content.replace(componentPattern3, `<i className="${cssClass}$1"></i>`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
  }
});

console.log('\n✅ All files processed!');

