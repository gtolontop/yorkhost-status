import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Verifying checks in database...\n')
  
  const checks = await prisma.check.findMany({
    include: {
      service: true
    }
  })
  
  console.log(`Total checks: ${checks.length}\n`)
  
  for (const check of checks) {
    console.log(`Check: ${check.name}`)
    console.log(`  - ID: ${check.id}`)
    console.log(`  - Service: ${check.service.name}`)
    console.log(`  - Type: ${check.type}`)
    console.log(`  - Target: ${check.target}`)
    console.log(`  - Expected Status: ${check.expectedStatus || 'Any success status'}`)
    console.log(`  - Follow Redirects: ${check.followRedirects}`)
    console.log(`  - Active: ${check.isActive}`)
    console.log(`  - Interval: ${check.interval}s\n`)
  }
  
  // Get recent check results
  const recentResults = await prisma.checkResult.findMany({
    take: 5,
    orderBy: {
      timestamp: 'desc'
    },
    include: {
      check: {
        include: {
          service: true
        }
      }
    }
  })
  
  console.log('\n📊 Recent check results:')
  for (const result of recentResults) {
    console.log(`\n${result.check.service.name} - ${result.check.name}`)
    console.log(`  - Success: ${result.success ? '✅' : '❌'}`)
    console.log(`  - Response Time: ${result.responseTime}ms`)
    console.log(`  - Status Code: ${result.statusCode || 'N/A'}`)
    if (result.error) {
      console.log(`  - Error: ${result.error}`)
    }
    console.log(`  - Time: ${result.timestamp.toISOString()}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })