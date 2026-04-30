/**
 * Dependency Verification Script
 * Checks if all critical dependencies are installed and accessible
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Dependencies...\n')
console.log('='.repeat(60))

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

// Critical dependencies that must be installed
const criticalDeps = [
  'next',
  'react',
  'react-dom',
  'typescript',
  '@prisma/client',
  'prisma',
]

// Check node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules')
const nodeModulesExists = fs.existsSync(nodeModulesPath)

console.log(`📦 Node Modules: ${nodeModulesExists ? '✅ Found' : '❌ Missing'}`)

if (!nodeModulesExists) {
  console.log('\n❌ CRITICAL: node_modules directory not found!')
  console.log('   Run: npm install')
  process.exit(1)
}

// Check critical dependencies
console.log('\n🔍 Checking Critical Dependencies:')
let allFound = true

criticalDeps.forEach(dep => {
  const depPath = path.join(nodeModulesPath, dep)
  const exists = fs.existsSync(depPath)
  console.log(`   ${exists ? '✅' : '❌'} ${dep}`)
  if (!exists) allFound = false
})

// Check critical files
console.log('\n📄 Checking Critical Files:')
const criticalFiles = [
  'app/layout.tsx',
  'app/globals.css',
  'components/Layout.tsx',
  'next.config.js',
  'tsconfig.json',
  'lib/modules/index.ts',
]

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  const exists = fs.existsSync(filePath)
  console.log(`   ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) allFound = false
})

// Check Prisma
console.log('\n🗄️  Checking Prisma:')
const prismaSchema = fs.existsSync('prisma/schema.prisma')
const prismaClient = fs.existsSync(path.join(nodeModulesPath, '@prisma/client'))
console.log(`   ${prismaSchema ? '✅' : '❌'} prisma/schema.prisma`)
console.log(`   ${prismaClient ? '✅' : '❌'} @prisma/client installed`)

if (prismaSchema && !prismaClient) {
  console.log('\n⚠️  WARNING: Prisma schema exists but client not generated!')
  console.log('   Run: npm run prisma:generate')
}

console.log('\n' + '='.repeat(60))

if (allFound) {
  console.log('✅ All critical dependencies and files found!')
  console.log('\n📋 Next Steps:')
  console.log('   1. npm install (if not done)')
  console.log('   2. npm run prisma:generate (if Prisma client missing)')
  console.log('   3. npm run dev')
} else {
  console.log('❌ Some dependencies or files are missing!')
  console.log('\n🔧 Fix Steps:')
  console.log('   1. npm install')
  console.log('   2. npm run prisma:generate')
  console.log('   3. Check for missing files listed above')
  process.exit(1)
}







