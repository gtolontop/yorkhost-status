interface CheckResult {
  success: boolean
  timestamp: Date
  responseTime?: number | null
  error?: string | null
}

/**
 * Calcule le statut d'un service basé sur l'historique des checks
 *
 * Règles de transition:
 * - OPERATIONAL → DEGRADED: 1 échec
 * - DEGRADED → OUTAGE: 1 échec supplémentaire (2 échecs consécutifs total)
 * - OUTAGE → DEGRADED: 2 succès consécutifs
 * - DEGRADED → OPERATIONAL: 1 succès supplémentaire (3 succès consécutifs total depuis OUTAGE)
 *
 * Si on part de OPERATIONAL:
 * - 1er échec → DEGRADED
 * - 2ème échec consécutif → OUTAGE
 *
 * Pour revenir à OPERATIONAL depuis OUTAGE:
 * - 1er succès → reste OUTAGE
 * - 2ème succès consécutif → DEGRADED
 * - 3ème succès consécutif → OPERATIONAL
 */
export function calculateServiceStatus(results: CheckResult[]): 'operational' | 'degraded' | 'outage' {
  if (results.length === 0) return 'operational' // No data = assume operational

  // Sort results by timestamp to ensure we have the most recent first
  const sortedResults = [...results].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Nous allons analyser les N derniers résultats pour déterminer l'état
  const recentResults = sortedResults.slice(0, Math.min(10, sortedResults.length))

  // Comptons les succès et échecs consécutifs depuis le dernier check
  let consecutiveSuccesses = 0
  let consecutiveFailures = 0

  for (const result of recentResults) {
    if (result.success) {
      consecutiveSuccesses++
      if (consecutiveFailures > 0) break // On s'arrête dès qu'on change de type
    } else {
      consecutiveFailures++
      if (consecutiveSuccesses > 0) break // On s'arrête dès qu'on change de type
    }
  }

  // Logique de détermination du statut basée sur les patterns consécutifs

  // Si on a des échecs consécutifs
  if (consecutiveFailures > 0) {
    if (consecutiveFailures >= 2) {
      return 'outage' // 2+ échecs consécutifs = OUTAGE
    } else {
      // 1 seul échec, mais vérifions l'historique pour voir d'où on vient
      // Si on avait déjà des problèmes récemment, on pourrait être en OUTAGE
      if (recentResults.length >= 3) {
        const last3 = recentResults.slice(0, 3)
        const failures = last3.filter(r => !r.success).length
        if (failures >= 2) {
          return 'outage' // 2 échecs sur les 3 derniers = OUTAGE
        }
      }
      return 'degraded' // 1 échec = DEGRADED
    }
  }

  // Si on a des succès consécutifs
  if (consecutiveSuccesses > 0) {
    // Regardons l'historique pour déterminer d'où on vient

    // Cherchons s'il y a eu des échecs récents
    let recentFailureCount = 0
    let checkWindow = Math.min(6, recentResults.length)

    for (let i = 0; i < checkWindow; i++) {
      if (!recentResults[i].success) {
        recentFailureCount++
      }
    }

    // Si on avait des échecs récents
    if (recentFailureCount > 0) {
      // On était probablement en OUTAGE ou DEGRADED
      if (recentFailureCount >= 2) {
        // On venait d'un OUTAGE
        if (consecutiveSuccesses >= 3) {
          return 'operational' // 3 succès consécutifs après OUTAGE = OPERATIONAL
        } else if (consecutiveSuccesses >= 2) {
          return 'degraded' // 2 succès consécutifs après OUTAGE = DEGRADED
        } else {
          return 'outage' // 1 seul succès après OUTAGE = reste OUTAGE
        }
      } else {
        // On venait d'un DEGRADED (1 seul échec récent)
        if (consecutiveSuccesses >= 1) {
          // Vérifions qu'on a assez de succès pour confirmer OPERATIONAL
          const last5 = recentResults.slice(0, Math.min(5, recentResults.length))
          const successRate = last5.filter(r => r.success).length / last5.length

          if (successRate >= 0.8) {
            return 'operational' // Bon taux de succès = OPERATIONAL
          }
          return 'degraded' // Pas assez stable = reste DEGRADED
        }
      }
    }

    // Pas d'échecs récents et des succès = OPERATIONAL
    return 'operational'
  }

  // Par défaut, on considère le service comme opérationnel
  return 'operational'
}

export function calculateUptime(results: CheckResult[]): number {
  if (results.length === 0) return 100 // No data = assume 100% uptime

  const successfulChecks = results.filter(r => r.success).length
  return Math.round((successfulChecks / results.length) * 10000) / 100
}

export function getLatestResponseTime(results: CheckResult[]): number {
  if (results.length === 0) return 0

  // Sort to get the most recent
  const sortedResults = [...results].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const latestResult = sortedResults[0]

  // If the latest check failed, return 0 instead of a high value
  if (!latestResult.success) return 0

  return latestResult?.responseTime || 0
}

export function getLastCheckTime(results: CheckResult[]): string {
  if (results.length === 0) return new Date().toISOString()

  // Sort to get the most recent
  const sortedResults = [...results].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const latestResult = sortedResults[0]
  return latestResult?.timestamp?.toString() || new Date().toISOString()
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