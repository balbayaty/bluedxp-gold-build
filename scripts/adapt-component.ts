/**
 * Component Adaptation Script
 * Converts chemcheck components to Hazalyze format
 * - Updates icon imports (react-icons/fi → remixicon)
 * - Updates import paths
 * - Adapts to Hazalyze design system
 */

import * as fs from 'fs'
import * as path from 'path'

// Icon mapping: react-icons/fi → remixicon
const ICON_MAPPING: Record<string, string> = {
  'FiUser': 'ri-user-line',
  'FiPlus': 'ri-add-line',
  'FiX': 'ri-close-line',
  'FiSearch': 'ri-search-line',
  'FiCheck': 'ri-check-line',
  'FiCheckCircle': 'ri-checkbox-circle-line',
  'FiAlertCircle': 'ri-alert-line',
  'FiCalendar': 'ri-calendar-line',
  'FiClock': 'ri-time-line',
  'FiFileText': 'ri-file-text-line',
  'FiUpload': 'ri-upload-line',
  'FiDownload': 'ri-download-line',
  'FiEdit': 'ri-edit-line',
  'FiTrash2': 'ri-delete-bin-line',
  'FiMapPin': 'ri-map-pin-line',
  'FiShield': 'ri-shield-line',
  'FiThermometer': 'ri-temp-cold-line',
  'FiTrendingUp': 'ri-arrow-up-line',
  'FiUsers': 'ri-group-line',
  'FiPackage': 'ri-box-line',
  'FiTool': 'ri-tools-line',
  'FiBriefcase': 'ri-briefcase-line',
  'FiCpu': 'ri-cpu-line',
  'FiDollarSign': 'ri-money-dollar-circle-line',
  'FiPaperclip': 'ri-attachment-line',
  'FiGlobe': 'ri-global-line',
  'FiDroplet': 'ri-drop-line',
  'FiWind': 'ri-windy-line',
  'FiInfo': 'ri-information-line',
  'FiXCircle': 'ri-close-circle-line',
  'FiMaximize2': 'ri-fullscreen-line',
  'FiGrid': 'ri-grid-line',
}

function adaptComponent(filePath: string, outputPath: string): void {
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // Replace icon imports
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]react-icons\/fi['"]/g,
    (match, imports) => {
      const iconList = imports.split(',').map((i: string) => i.trim())
      const remixIcons = iconList.map((icon: string) => {
        const remixIcon = ICON_MAPPING[icon] || icon.toLowerCase().replace('fi', 'ri')
        return `'${remixIcon}'`
      }).join(', ')
      return `import { ${iconList.join(', ')} } from 'remixicon'`
    }
  )
  
  // Replace icon usage in JSX
  Object.entries(ICON_MAPPING).forEach(([fiIcon, remixIcon]) => {
    const regex = new RegExp(`<${fiIcon}([^>]*)>`, 'g')
    content = content.replace(regex, `<i className="${remixIcon}$1"></i>`)
  })
  
  // Update import paths
  content = content.replace(/from\s+['"]\.\.\/components\//g, "from '@/components/")
  content = content.replace(/from\s+['"]\.\.\/lib\//g, "from '@/lib/")
  content = content.replace(/from\s+['"]\.\.\/utils\//g, "from '@/utils/")
  
  // Write adapted file
  fs.writeFileSync(outputPath, content, 'utf-8')
  console.log(`✅ Adapted: ${path.basename(filePath)} → ${path.basename(outputPath)}`)
}

// Export for use in integration script
export { adaptComponent, ICON_MAPPING }



