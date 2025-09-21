import { PrismaClient, CheckType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Yorkhost checks...')
  
  // Find all checks for yorkhost.fr
  const checks = await prisma.check.findMany({
    where: {
      OR: [
        { target: 'https://yorkhost.fr' },
        { target: 'yorkhost.fr' }
      ]
    }
  })
  
  console.log(`Found ${checks.length} checks to update`)
  
  // Update each check
  for (const check of checks) {
    const updated = await prisma.check.update({
      where: { id: check.id },
      data: {
        type: CheckType.HTTPS,
        expectedStatus: null, // Allow any success status including redirects
        followRedirects: true,
        target: check.target.startsWith('http') ? check.target : `https://${check.target}`
      }
    })
    
    console.log(`✅ Updated check ${updated.id}: ${updated.name}`)
    console.log(`   - Type: ${updated.type}`)
    console.log(`   - Expected Status: ${updated.expectedStatus || 'Any success status'}`)
    console.log(`   - Follow Redirects: ${updated.followRedirects}`)
  }
  
  // Also update any HTTP checks that should be HTTPS
  const httpChecks = await prisma.check.findMany({
    where: {
      type: CheckType.HTTP,
      target: {
        startsWith: 'https://'
      }
    }
  })
  
  console.log(`\nFound ${httpChecks.length} HTTP checks with HTTPS URLs to fix`)
  
  for (const check of httpChecks) {
    const updated = await prisma.check.update({
      where: { id: check.id },
      data: {
        type: CheckType.HTTPS
      }
    })
    
    console.log(`✅ Fixed check type for ${updated.id}: ${updated.name}`)
  }
  
  console.log('\n✨ All checks have been updated!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })