interface CheckResult {
  success: boolean
  timestamp: Date
  responseTime?: number | null
  error?: string | null
}

export function calculateServiceStatus(results: CheckResult[]): 'operational' | 'degraded' | 'outage' {
  if (results.length === 0) return 'operational' // No data = assume operational
  
  // Sort results by timestamp to ensure we have the most recent first
  const sortedResults = [...results].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  
  // Need at least 2 consecutive failures for outage
  if (sortedResults.length >= 2) {
    const lastTwo = sortedResults.slice(0, 2)
    if (lastTwo.every(r => !r.success)) {
      return 'outage'
    }
  }
  
  // If the most recent check succeeded, we're at least degraded (not outage)
  if (sortedResults[0].success) {
    // Check last 5 results for operational vs degraded
    const recentResults = sortedResults.slice(0, Math.min(5, sortedResults.length))
    const successRate = recentResults.filter(r => r.success).length / recentResults.length
    
    if (successRate >= 0.9) return 'operational'
    return 'degraded'
  }
  
  // Single failure = degraded
  return 'degraded'
}

export function calculateUptime(results: CheckResult[]): number {
  if (results.length === 0) return 0 // No data = can't calculate uptime
  
  const successfulChecks = results.filter(r => r.success).length
  return Math.round((successfulChecks / results.length) * 10000) / 100
}

export function getLatestResponseTime(results: CheckResult[]): number {
  if (results.length === 0) return 0
  
  const latestResult = results[0]
  
  // If the latest check failed, return 0 instead of a high value
  if (!latestResult.success) return 0
  
  return latestResult?.responseTime || 0
}

export function getLastCheckTime(results: CheckResult[]): string {
  const latestResult = results[0]
  return latestResult?.timestamp?.toISOString() || new Date().toISOString()
}

// Convert between different status formats for compatibility
export function convertStatusToMonitoring(status: 'operational' | 'degraded' | 'outage'): 'up' | 'down' | 'degraded' {
  switch (status) {
    case 'operational':
      return 'up'
    case 'degraded':
      return 'degraded'
    case 'outage':
      return 'down'
    default:
      return 'down'
  }
}

export function convertStatusToService(status: 'up' | 'down' | 'degraded'): 'operational' | 'degraded' | 'outage' {
  switch (status) {
    case 'up':
      return 'operational'
    case 'degraded':
      return 'degraded'
    case 'down':
      return 'outage'
    default:
      return 'outage'
  }
}