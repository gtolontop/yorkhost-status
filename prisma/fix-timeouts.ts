import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing check timeouts...')
  
  // Get all checks with very short timeouts
  const checks = await prisma.check.findMany({
    where: {
      timeout: { lt: 1000 } // Less than 1 second
    }
  })
  
  console.log(`Found ${checks.length} checks with short timeouts to fix`)
  
  for (const check of checks) {
    const newTimeout = check.timeout * 1000 // Convert seconds to milliseconds
    const updated = await prisma.check.update({
      where: { id: check.id },
      data: {
        timeout: newTimeout
      }
    })
    
    console.log(`✅ Fixed ${updated.name}: ${check.timeout}ms → ${newTimeout}ms`)
  }
  
  console.log('\n✨ All timeouts have been fixed!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })