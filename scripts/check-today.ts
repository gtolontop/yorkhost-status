import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function checkToday() {
  const today = new Date('2025-09-21')
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  console.log(`\n=== Checking for data on ${today.toISOString().split('T')[0]} ===\n`)
  
  try {
    // Direct query for today's check results
    const todayResults = await prisma.checkResult.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        check: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    console.log(`Found ${todayResults.length} check results for today\n`)
    
    if (todayResults.length > 0) {
      console.log('Sample results:')
      todayResults.slice(0, 5).forEach(result => {
        console.log(`- ${result.timestamp.toISOString()} | ${result.check.service.name} | Success: ${result.success}`)
      })
    }
    
    // Also check the most recent result overall
    const mostRecent = await prisma.checkResult.findFirst({
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
    
    if (mostRecent) {
      console.log(`\nMost recent check result in database:`)
      console.log(`${mostRecent.timestamp.toISOString()} | ${mostRecent.check.service.name}`)
      
      const hoursSince = (Date.now() - mostRecent.timestamp.getTime()) / (1000 * 60 * 60)
      console.log(`This was ${hoursSince.toFixed(1)} hours ago`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkToday()