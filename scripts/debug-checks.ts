import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugChecks() {
  try {
    console.log('=== Debug Check System ===')
    console.log(`Current time: ${new Date().toISOString()}`)
    
    // 1. Check if there are any services
    const serviceCount = await prisma.service.count()
    console.log(`\n1. Total services: ${serviceCount}`)
    
    const activeServices = await prisma.service.findMany({
      where: { isActive: true }
    })
    console.log(`   Active services: ${activeServices.length}`)
    
    // 2. Check if there are any checks configured
    const checkCount = await prisma.check.count()
    console.log(`\n2. Total checks: ${checkCount}`)
    
    const activeChecks = await prisma.check.findMany({
      where: { isActive: true },
      include: { service: true }
    })
    console.log(`   Active checks: ${activeChecks.length}`)
    
    if (activeChecks.length > 0) {
      console.log(`\n   Active check details:`)
      activeChecks.forEach(check => {
        console.log(`   - ${check.name} (${check.type}) for ${check.service.name} - Interval: ${check.interval}s`)
      })
    }
    
    // 3. Check total number of check results
    const totalResults = await prisma.checkResult.count()
    console.log(`\n3. Total check results in database: ${totalResults}`)
    
    // 4. Get check results from different time periods
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const [lastHour, lastDay, lastWeek] = await Promise.all([
      prisma.checkResult.count({
        where: { timestamp: { gte: oneHourAgo } }
      }),
      prisma.checkResult.count({
        where: { timestamp: { gte: oneDayAgo } }
      }),
      prisma.checkResult.count({
        where: { timestamp: { gte: oneWeekAgo } }
      })
    ])
    
    console.log(`\n4. Check results by time period:`)
    console.log(`   - Last hour: ${lastHour}`)
    console.log(`   - Last 24 hours: ${lastDay}`)
    console.log(`   - Last 7 days: ${lastWeek}`)
    
    // 5. Get the most recent check results
    const recentResults = await prisma.checkResult.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        check: {
          include: {
            service: true
          }
        }
      }
    })
    
    console.log(`\n5. Most recent check results:`)
    if (recentResults.length === 0) {
      console.log(`   No check results found!`)
    } else {
      recentResults.forEach(result => {
        const timeDiff = now.getTime() - result.timestamp.getTime()
        const minutesAgo = Math.floor(timeDiff / (1000 * 60))
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
        const timeAgoStr = hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo % 60}m ago` : `${minutesAgo}m ago`
        
        console.log(`   - ${result.timestamp.toISOString()} (${timeAgoStr})`)
        console.log(`     Service: ${result.check.service.name} | Check: ${result.check.name}`)
        console.log(`     Success: ${result.success} | Response Time: ${result.responseTime}ms`)
      })
    }
    
    // 6. Check for any errors in recent failed checks
    const failedChecks = await prisma.checkResult.findMany({
      where: {
        success: false,
        timestamp: { gte: oneDayAgo }
      },
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        check: {
          include: {
            service: true
          }
        }
      }
    })
    
    console.log(`\n6. Recent failed checks:`)
    if (failedChecks.length === 0) {
      console.log(`   No failed checks in the last 24 hours`)
    } else {
      failedChecks.forEach(result => {
        console.log(`   - ${result.timestamp.toISOString()} | ${result.check.service.name}`)
        console.log(`     Error: ${result.error || 'No error message'}`)
      })
    }
    
    // 7. Check when each service was last checked
    console.log(`\n7. Last check time for each service:`)
    for (const service of activeServices) {
      const lastCheck = await prisma.checkResult.findFirst({
        where: {
          check: {
            serviceId: service.id
          }
        },
        orderBy: { timestamp: 'desc' },
        include: {
          check: true
        }
      })
      
      if (lastCheck) {
        const timeDiff = now.getTime() - lastCheck.timestamp.getTime()
        const minutesAgo = Math.floor(timeDiff / (1000 * 60))
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
        const timeAgoStr = hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo % 60}m ago` : `${minutesAgo}m ago`
        
        console.log(`   - ${service.name}: ${timeAgoStr} (${lastCheck.timestamp.toISOString()})`)
      } else {
        console.log(`   - ${service.name}: Never checked`)
      }
    }
    
    // 8. Check uptime stats table
    const uptimeStatsCount = await prisma.uptimeStats.count()
    console.log(`\n8. Uptime stats entries: ${uptimeStatsCount}`)
    
    if (uptimeStatsCount > 0) {
      const recentStats = await prisma.uptimeStats.findMany({
        take: 5,
        orderBy: { date: 'desc' }
      })
      
      console.log(`   Recent uptime stats:`)
      recentStats.forEach(stat => {
        console.log(`   - ${stat.date.toISOString().split('T')[0]}: ${stat.uptimePercent.toFixed(2)}% (${stat.successfulChecks}/${stat.totalChecks} checks)`)
      })
    }
    
  } catch (error) {
    console.error('Error debugging checks:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the debug
debugChecks()