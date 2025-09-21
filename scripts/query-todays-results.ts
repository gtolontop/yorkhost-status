import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function queryTodaysCheckResults() {
  try {
    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get tomorrow's date at midnight for the upper bound
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    console.log(`Querying check results for today: ${today.toISOString().split('T')[0]}`)
    console.log(`Time range: ${today.toISOString()} to ${tomorrow.toISOString()}`)
    
    // Count total check results for today
    const totalCount = await prisma.checkResult.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    console.log(`\nTotal check results today: ${totalCount}`)
    
    // Get breakdown by success/failure
    const successCount = await prisma.checkResult.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        },
        success: true
      }
    })
    
    const failureCount = await prisma.checkResult.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        },
        success: false
      }
    })
    
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${failureCount}`)
    
    // Get the latest 10 check results
    const latestResults = await prisma.checkResult.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      take: 10,
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
    
    console.log(`\nLatest 10 check results today:`)
    latestResults.forEach(result => {
      console.log(`- ${result.timestamp.toISOString()} | ${result.check.service.name} | ${result.check.name} | Success: ${result.success} | Response Time: ${result.responseTime}ms`)
    })
    
    // Get check results grouped by service
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      },
      include: {
        checks: {
          include: {
            results: {
              where: {
                timestamp: {
                  gte: today,
                  lt: tomorrow
                }
              }
            }
          }
        }
      }
    })
    
    console.log(`\nCheck results by service:`)
    services.forEach(service => {
      let totalChecks = 0
      let successfulChecks = 0
      
      service.checks.forEach(check => {
        totalChecks += check.results.length
        successfulChecks += check.results.filter(r => r.success).length
      })
      
      if (totalChecks > 0) {
        const uptime = (successfulChecks / totalChecks * 100).toFixed(2)
        console.log(`- ${service.name}: ${totalChecks} checks, ${successfulChecks} successful (${uptime}% uptime)`)
      } else {
        console.log(`- ${service.name}: No checks today`)
      }
    })
    
    // Get any check results from the last hour
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const lastHourCount = await prisma.checkResult.count({
      where: {
        timestamp: {
          gte: oneHourAgo
        }
      }
    })
    
    console.log(`\nCheck results in the last hour: ${lastHourCount}`)
    
    // Get the most recent check result overall
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
      console.log(`\nMost recent check result (overall):`)
      console.log(`- ${mostRecent.timestamp.toISOString()} | ${mostRecent.check.service.name} | ${mostRecent.check.name} | Success: ${mostRecent.success}`)
    }
    
  } catch (error) {
    console.error('Error querying check results:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the query
queryTodaysCheckResults()