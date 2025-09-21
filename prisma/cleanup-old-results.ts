import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up old check results with errors...')
  
  // Delete all results with "Unsupported check type" error
  const deleted = await prisma.checkResult.deleteMany({
    where: {
      error: {
        contains: 'Unsupported check type'
      }
    }
  })
  
  console.log(`✅ Deleted ${deleted.count} old results with "Unsupported check type" errors`)
  
  // Also delete very old results (older than 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const deletedOld = await prisma.checkResult.deleteMany({
    where: {
      timestamp: {
        lt: yesterday
      }
    }
  })
  
  console.log(`✅ Deleted ${deletedOld.count} results older than 24 hours`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })