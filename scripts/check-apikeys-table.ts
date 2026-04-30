import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const columns = await prisma.$queryRaw<{column_name: string, data_type: string, is_nullable: string}[]>`
    SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'api_keys' ORDER BY ordinal_position
  `
  console.log('\nAPI_KEYS TABLE:')
  for (const c of columns) {
    console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'required'})`)
  }
  await prisma.$disconnect()
}
main()










