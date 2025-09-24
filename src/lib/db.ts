import { PrismaClient } from '@prisma/client'
import { UptimeData } from '@/types'

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

/**
 * Get uptime history for a service
 */
export async function getUptimeHistory(serviceId: string, days: number = 30): Promise<UptimeData[]> {
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  const checkResults = await prisma.checkResult.findMany({
    where: {
      check: {
        serviceId: serviceId
      },
      timestamp: {
        gte: startDate
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
      timestamp: 'asc'
    }
  })

  // Group results by day
  const dailyData: { [key: string]: { total: number; successful: number } } = {}
  
  checkResults.forEach(result => {
    // Utiliser la date locale au lieu d'UTC pour correspondre au frontend
    const year = result.timestamp.getFullYear()
    const month = String(result.timestamp.getMonth() + 1).padStart(2, '0')
    const day = String(result.timestamp.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { total: 0, successful: 0 }
    }
    
    dailyData[dateKey].total++
    if (result.success) {
      dailyData[dateKey].successful++
    }
  })
  
  // Get all incidents for the period in one query
  const periodStart = new Date()
  periodStart.setUTCDate(periodStart.getUTCDate() - days)
  periodStart.setUTCHours(0, 0, 0, 0)

  const allIncidents = await prisma.incident.findMany({
    where: {
      OR: [
        {
          serviceId: serviceId,
          type: 'INCIDENT',
          startTime: {
            gte: periodStart
          }
        },
        {
          type: 'MAINTENANCE',
          OR: [
            {
              scheduledFor: {
                gte: periodStart
              }
            },
            {
              startTime: {
                gte: periodStart
              }
            }
          ],
          affectedServices: {
            has: serviceId
          }
        }
      ]
    },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      severity: true,
      startTime: true,
      endTime: true,
      scheduledFor: true,
      scheduledEnd: true,
      affectedServices: true
    }
  })

  // Group incidents and maintenances by date
  const incidentsByDate: { [key: string]: any[] } = {}
  const maintenancesByDate: { [key: string]: any[] } = {}

  allIncidents.forEach(incident => {
    // For maintenances, use scheduledFor date if available, otherwise startTime
    const relevantDate = incident.type === 'MAINTENANCE' && incident.scheduledFor
      ? incident.scheduledFor
      : incident.startTime

    // Utiliser la même logique de date key locale
    const year = relevantDate.getFullYear()
    const month = String(relevantDate.getMonth() + 1).padStart(2, '0')
    const day = String(relevantDate.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    if (incident.type === 'MAINTENANCE') {
      if (!maintenancesByDate[dateKey]) {
        maintenancesByDate[dateKey] = []
      }
      maintenancesByDate[dateKey].push({
        ...incident,
        endTime: incident.endTime || undefined
      })
    } else {
      if (!incidentsByDate[dateKey]) {
        incidentsByDate[dateKey] = []
      }
      incidentsByDate[dateKey].push({
        ...incident,
        endTime: incident.endTime || undefined
      })
    }
  })

  // Convert to UptimeData array
  const uptimeData: UptimeData[] = []
  let lastKnownUptime: number | null = null // No assumption, wait for real data
  let hasSeenData = false // Track if we've seen any real data yet

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    date.setHours(0, 0, 0, 0) // Reset time to start of day in local time

    // Utiliser la même logique de date key que pour les données
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    const dayData = dailyData[dateKey]
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    // Si on a des données pour ce jour, calculer l'uptime
    let uptime: number | null
    if (dayData && dayData.total > 0) {
      uptime = (dayData.successful / dayData.total) * 100
      lastKnownUptime = uptime // Update last known uptime
      hasSeenData = true
    } else {
      // Pas de données pour ce jour
      const hasIncidents = incidentsByDate[dateKey] && incidentsByDate[dateKey].length > 0
      const hasMaintenances = maintenancesByDate[dateKey] && maintenancesByDate[dateKey].length > 0

      if (hasSeenData && lastKnownUptime !== null) {
        // On a déjà vu des données, maintenir la continuité
        if (hasIncidents && !hasMaintenances) {
          // S'il y a des incidents sans maintenance, réduire l'uptime
          uptime = Math.max(lastKnownUptime * 0.8, 0) // Réduire de 20%
          lastKnownUptime = uptime
        } else if (hasMaintenances) {
          // Maintenance planifiée - garder le dernier uptime connu
          uptime = lastKnownUptime
        } else {
          // Pas de données, pas d'incidents - maintenir le statut précédent
          uptime = lastKnownUptime
        }
      } else {
        // Pas encore vu de données réelles, afficher "no data"
        uptime = null
      }
    }

    uptimeData.push({
      date: dateKey,
      uptime: uptime !== null ? Math.round(uptime * 100) / 100 : null as any,
      incidents: incidentsByDate[dateKey] || [],
      maintenances: maintenancesByDate[dateKey] || []
    })
  }

  return uptimeData
}

/**
 * Get service stats
 */
export async function getServiceStats(serviceId: string) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get check results for different periods
  const [results24h, results7d, results30d, latestResult] = await Promise.all([
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: yesterday }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: lastWeek }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: lastMonth }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findFirst({
      where: {
        check: { serviceId }
      },
      orderBy: { timestamp: 'desc' }
    })
  ])

  const calculateUptime = (results: any[]) => {
    if (results.length === 0) return 0 // No data = 0% uptime
    const successful = results.filter(r => r.success).length
    return (successful / results.length) * 100
  }

  const getCurrentStatus = (results: any[]) => {
    if (results.length === 0) return 'unknown'
    
    // Need at least 2 results to determine consecutive failures
    if (results.length === 1) {
      return results[0].success ? 'operational' : 'degraded'
    }
    
    // Check if the last 2 checks failed consecutively
    const lastTwo = results.slice(-2)
    const consecutiveFailures = lastTwo.every(r => !r.success)
    
    if (consecutiveFailures) return 'outage'
    
    // Check last few results for degraded performance
    const recentResults = results.slice(-5)
    const successRate = recentResults.filter(r => r.success).length / recentResults.length
    
    if (successRate === 1) return 'operational'
    if (successRate >= 0.8) return 'degraded'
    return 'outage'
  }

  const getAverageResponseTime = (results: any[]) => {
    if (results.length === 0) return 0
    const validResults = results.filter(r => r.responseTime && r.success)
    if (validResults.length === 0) return 0
    
    const sum = validResults.reduce((acc, r) => acc + r.responseTime, 0)
    return sum / validResults.length
  }

  return {
    uptimePercent24h: calculateUptime(results24h),
    uptimePercent7d: calculateUptime(results7d),
    uptimePercent30d: calculateUptime(results30d),
    currentStatus: getCurrentStatus(results24h),
    lastCheck: latestResult?.timestamp,
    averageResponseTime: getAverageResponseTime(results24h)
  }
}

/**
 * Get overall status overview
 */
export async function getStatusOverview() {
  const [servicesWithEnhancedStatus, activeIncidents] = await Promise.all([
    getServicesWithEnhancedStatus(),
    prisma.incident.findMany({
      where: {
        OR: [
          {
            // Active incidents
            type: 'INCIDENT',
            status: {
              in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
            }
          },
          {
            // Scheduled maintenances
            type: 'MAINTENANCE',
            status: 'SCHEDULED',
            scheduledFor: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            }
          },
          {
            // Ongoing maintenances
            type: 'MAINTENANCE',
            status: 'IN_PROGRESS'
          }
        ]
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: true,
        machine: true,
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })
  ])

  // Calculate overall status based on enhanced status
  const allUptimes = servicesWithEnhancedStatus.map(s => s.uptimePercent24h)
  const averageUptime = allUptimes.length > 0 
    ? allUptimes.reduce((sum, uptime) => sum + uptime, 0) / allUptimes.length 
    : 100

  let overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance' = 'operational'
  
  // Check if any service has an outage
  const hasOutage = servicesWithEnhancedStatus.some(s => 
    s.enhancedStatus === 'outage' || s.enhancedStatus === 'outage-with-incident'
  )
  const hasDegraded = servicesWithEnhancedStatus.some(s => s.enhancedStatus === 'degraded')
  const hasActiveMaintenance = servicesWithEnhancedStatus.some(s => s.enhancedStatus === 'maintenance')
  const hasActiveIncidents = activeIncidents.some(i => i.type === 'INCIDENT')
  
  if (hasActiveMaintenance && !hasOutage && !hasActiveIncidents) {
    overallStatus = 'maintenance' as any
  } else if (hasOutage || activeIncidents.some(i => i.severity === 'CRITICAL')) {
    overallStatus = 'outage'
  } else if (hasDegraded || hasActiveIncidents) {
    overallStatus = 'degraded'
  }

  // Calculate uptime stats
  const uptimeStats = {
    '24h': Math.round(averageUptime * 100) / 100,
    '7d': Math.round(servicesWithEnhancedStatus.reduce((sum, s) => sum + s.uptimePercent7d, 0) / servicesWithEnhancedStatus.length * 100) / 100 || 100,
    '30d': Math.round(servicesWithEnhancedStatus.reduce((sum, s) => sum + s.uptimePercent30d, 0) / servicesWithEnhancedStatus.length * 100) / 100 || 100
  }

  return {
    overall: overallStatus,
    services: servicesWithEnhancedStatus,
    activeIncidents,
    uptimeStats,
    lastUpdated: new Date()
  }
}

/**
 * Get services with enhanced status including incident links
 */
export async function getServicesWithEnhancedStatus() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Get active incidents and maintenances in parallel
  const [activeMaintenances, activeIncidents] = await Promise.all([
    prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE',
        status: 'IN_PROGRESS'
      },
      select: {
        id: true,
        title: true,
        affectedServices: true
      }
    }),
    prisma.incident.findMany({
      where: {
        OR: [
          {
            // Active incidents
            type: 'INCIDENT',
            status: {
              in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
            }
          },
          {
            // Scheduled maintenances
            type: 'MAINTENANCE',
            status: 'SCHEDULED',
            scheduledFor: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            }
          },
          {
            // Ongoing maintenances
            type: 'MAINTENANCE',
            status: 'IN_PROGRESS'
          }
        ]
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: true,
        machine: true,
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })
  ])

  // Create a map of service IDs that are in maintenance
  const servicesInMaintenance = new Set<string>()
  activeMaintenances.forEach(maintenance => {
    maintenance.affectedServices.forEach(serviceId => {
      servicesInMaintenance.add(serviceId)
    })
  })

  // Get all services with their recent check results and active incidents
  const services = await prisma.service.findMany({
    where: {
      isActive: true
    },
    include: {
      machine: true,
      checks: {
        include: {
          results: {
            where: {
              timestamp: { gte: yesterday }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      },
      incidents: {
        where: {
          OR: [
            {
              status: {
                in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
              },
              type: 'INCIDENT'
            },
            {
              status: 'IN_PROGRESS',
              type: 'MAINTENANCE'
            }
          ]
        },
        orderBy: { startTime: 'desc' },
        take: 1
      }
    }
  })

  // Process each service to determine enhanced status
  const servicesWithEnhancedStatus = await Promise.all(
    services.map(async (service) => {
      const stats = await getServiceStats(service.id)
      
      // Determine enhanced status based on:
      // 1. Operational status (operational, degraded, outage)
      // 2. Whether there's a linked incident
      // 3. Active incidents for this service (even if created manually)
      let enhancedStatus: 'operational' | 'degraded' | 'outage' | 'outage-with-incident' | 'maintenance' = 'operational'

      const hasActiveIncident = service.incidents.length > 0 && service.incidents[0].type === 'INCIDENT'
      const hasActiveMaintenance = service.incidents.length > 0 && service.incidents[0].type === 'MAINTENANCE'
      const isInMaintenance = servicesInMaintenance.has(service.id)

      // Check if there are any active incidents for this service
      const hasAnyActiveIncident = activeIncidents.some(incident =>
        incident.serviceId === service.id &&
        incident.type === 'INCIDENT' &&
        ['INVESTIGATING', 'IDENTIFIED', 'MONITORING'].includes(incident.status)
      )

      if (hasActiveMaintenance || isInMaintenance) {
        enhancedStatus = 'maintenance'
      } else if (hasAnyActiveIncident) {
        // Force status to outage-with-incident if there's an active incident
        enhancedStatus = 'outage-with-incident'
      } else if (stats.currentStatus === 'outage') {
        enhancedStatus = hasActiveIncident ? 'outage-with-incident' : 'outage'
      } else if (stats.currentStatus === 'degraded') {
        enhancedStatus = 'degraded'
      } else {
        enhancedStatus = 'operational'
      }

      // Find the correct active incident (prioritize the one from activeIncidents list)
      const correctActiveIncident = hasAnyActiveIncident
        ? activeIncidents.find(incident =>
            incident.serviceId === service.id &&
            incident.type === 'INCIDENT' &&
            ['INVESTIGATING', 'IDENTIFIED', 'MONITORING'].includes(incident.status)
          )
        : service.incidents[0]

      return {
        ...service,
        ...stats,
        enhancedStatus,
        activeIncident: correctActiveIncident || null
      }
    })
  )

  return servicesWithEnhancedStatus
}

/**
 * Get all services that are currently down
 */
export async function getDownServices() {
  const servicesWithStatus = await getServicesWithEnhancedStatus()
  
  // Filter only services that are down (outage or outage-with-incident)
  const downServices = servicesWithStatus.filter(service => 
    service.enhancedStatus === 'outage' || 
    service.enhancedStatus === 'outage-with-incident'
  )

  // Group by status type for easier display
  return {
    withoutIncident: downServices.filter(s => s.enhancedStatus === 'outage'),
    withIncident: downServices.filter(s => s.enhancedStatus === 'outage-with-incident'),
    totalDown: downServices.length,
    lastUpdated: new Date()
  }
}

/**
 * Get dashboard statistics for admin panel
 */
export async function getDashboardStats() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalServices,
    totalChecks,
    activeIncidents,
    checksLast24h,
    failedChecksLast24h,
    allServices
  ] = await Promise.all([
    prisma.service.count(),
    prisma.check.count(),
    prisma.incident.count({
      where: {
        status: {
          in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
        }
      }
    }),
    prisma.checkResult.count({
      where: {
        timestamp: { gte: yesterday }
      }
    }),
    prisma.checkResult.count({
      where: {
        timestamp: { gte: yesterday },
        success: false
      }
    }),
    prisma.service.findMany({
      include: {
        checks: {
          include: {
            results: {
              where: {
                timestamp: { gte: yesterday }
              }
            }
          }
        }
      }
    })
  ])

  // Calculate average uptime
  let totalUptime = 0
  let serviceCount = 0

  for (const service of allServices) {
    const stats = await getServiceStats(service.id)
    totalUptime += stats.uptimePercent24h
    serviceCount++
  }

  const averageUptime = serviceCount > 0 ? totalUptime / serviceCount : 100

  // Calculate response time P95
  const allResponseTimes = await prisma.checkResult.findMany({
    where: {
      timestamp: { gte: yesterday },
      success: true,
      responseTime: { not: null }
    },
    select: {
      responseTime: true
    },
    orderBy: {
      responseTime: 'asc'
    }
  })

  const responseTimeP95 = allResponseTimes.length > 0
    ? allResponseTimes[Math.floor(allResponseTimes.length * 0.95)]?.responseTime || 0
    : 0

  // Calculate MTTR (Mean Time To Recovery)
  const resolvedIncidents = await prisma.incident.findMany({
    where: {
      status: 'RESOLVED',
      endTime: { not: null },
      startTime: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    },
    select: {
      startTime: true,
      endTime: true
    }
  })

  let totalRecoveryTime = 0
  resolvedIncidents.forEach(incident => {
    if (incident.endTime) {
      totalRecoveryTime += incident.endTime.getTime() - incident.startTime.getTime()
    }
  })

  const mttr = resolvedIncidents.length > 0
    ? totalRecoveryTime / resolvedIncidents.length / (1000 * 60) // Convert to minutes
    : 0

  return {
    totalServices,
    totalChecks,
    activeIncidents,
    averageUptime: Math.round(averageUptime * 100) / 100,
    checksLast24h,
    failedChecksLast24h,
    responseTimeP95: Math.round(responseTimeP95),
    mttr: Math.round(mttr)
  }
}