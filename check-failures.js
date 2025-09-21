// Script to check recent failures for yorkhost.fr
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRecentFailures() {
  try {
    // Find the check for yorkhost.fr
    const check = await prisma.check.findFirst({
      where: {
        target: {
          contains: 'yorkhost.fr'
        }
      },
      include: {
        service: true
      }
    })
    
    if (!check) {
      console.log('No check found for yorkhost.fr')
      return
    }
    
    console.log('Check found:')
    console.log('- ID:', check.id)
    console.log('- Name:', check.name)
    console.log('- Type:', check.type)
    console.log('- Target:', check.target)
    console.log('- Service:', check.service.name)
    console.log('- Follow Redirects:', check.followRedirects)
    console.log('- Expected Status:', check.expectedStatus)
    console.log('')
    
    // Get recent check results
    const recentResults = await prisma.checkResult.findMany({
      where: {
        checkId: check.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    })
    
    console.log(`Recent results (last 10):`)
    for (const result of recentResults) {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${result.timestamp.toISOString()} - Status: ${result.statusCode} - Response Time: ${result.responseTime}ms`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }
    
    // Count success/failure rate
    const last100 = await prisma.checkResult.findMany({
      where: {
        checkId: check.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100,
      select: {
        success: true
      }
    })
    
    const successCount = last100.filter(r => r.success).length
    const failureCount = last100.length - successCount
    console.log(`\nLast 100 checks: ${successCount} successful, ${failureCount} failed (${(successCount/last100.length*100).toFixed(1)}% uptime)`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentFailures()