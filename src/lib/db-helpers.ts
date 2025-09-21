import { prisma } from './db'

/**
 * Get current status of a service based on its recent check results
 */
export function getCurrentStatus(service: any): 'operational' | 'degraded' | 'outage' | 'unknown' {
  if (!service.checks || service.checks.length === 0) return 'unknown'
  
  // Get all check results from all checks
  const allResults = service.checks.flatMap((check: any) => check.results || [])
  
  if (allResults.length === 0) return 'unknown'
  
  // Sort by timestamp to get most recent results
  allResults.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  // Need at least 2 results to determine consecutive failures
  if (allResults.length === 1) {
    return allResults[0].success ? 'operational' : 'degraded'
  }
  
  // Check if the last 2 checks failed consecutively
  const lastTwo = allResults.slice(0, 2)
  const consecutiveFailures = lastTwo.every((r: any) => !r.success)
  
  if (consecutiveFailures) return 'outage'
  
  // Check last few results for degraded performance
  const recentResults = allResults.slice(0, Math.min(5, allResults.length))
  const successRate = recentResults.filter((r: any) => r.success).length / recentResults.length
  
  if (successRate === 1) return 'operational'
  if (successRate >= 0.8) return 'degraded'
  return 'outage'
}

/**
 * Calculate uptime percentage for a service over a given time period
 */
export async function getUptimePercentage(serviceId: string, hours: number = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  const results = await prisma.checkResult.findMany({
    where: {
      check: { serviceId },
      timestamp: { gte: since }
    },
    select: {
      success: true
    }
  })
  
  if (results.length === 0) return 100 // No data = assume 100% uptime
  
  const successful = results.filter(r => r.success).length
  return Math.round((successful / results.length) * 100 * 100) / 100 // Round to 2 decimals
}