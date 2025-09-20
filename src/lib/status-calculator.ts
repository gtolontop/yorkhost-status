interface CheckResult {
  success: boolean
  timestamp: Date
  responseTime?: number | null
  error?: string | null
}

export function calculateServiceStatus(results: CheckResult[]): 'operational' | 'degraded' | 'outage' {
  if (results.length === 0) return 'operational'
  
  // Check last 5 results for more accurate status
  const recentResults = results.slice(0, 5)
  const successRate = recentResults.filter(r => r.success).length / recentResults.length
  
  if (successRate === 1) return 'operational'
  if (successRate >= 0.8) return 'degraded'
  return 'outage'
}

export function calculateUptime(results: CheckResult[]): number {
  if (results.length === 0) return 100
  
  const successfulChecks = results.filter(r => r.success).length
  return Math.round((successfulChecks / results.length) * 10000) / 100
}

export function getLatestResponseTime(results: CheckResult[]): number {
  const latestResult = results[0]
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