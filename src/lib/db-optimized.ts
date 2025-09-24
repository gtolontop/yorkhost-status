import { prisma } from '@/lib/db'

interface UptimeData {
  date: string
  uptime: number | null
  incidents: any[]
}

export async function getOptimizedUptimeHistory(serviceId: string, days: number = 30): Promise<UptimeData[]> {
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  // Use raw SQL for better performance with aggregation
  const dailyStats = await prisma.$queryRaw<Array<{
    date: string
    total: bigint
    successful: bigint
  }>>`
    SELECT 
      DATE(cr."timestamp") as date,
      COUNT(*) as total,
      COUNT(CASE WHEN cr."success" = true THEN 1 END) as successful
    FROM "check_results" cr
    INNER JOIN "checks" c ON cr."checkId" = c."id"
    WHERE c."serviceId" = ${serviceId}
      AND cr."timestamp" >= ${startDate}
    GROUP BY DATE(cr."timestamp")
    ORDER BY date
  `

  // Get incidents
  const incidents = await prisma.incident.findMany({
    where: {
      serviceId: serviceId,
      startTime: {
        gte: startDate
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      severity: true,
      startTime: true,
      endTime: true
    }
  })

  // Group incidents by date
  const incidentsByDate: { [key: string]: any[] } = {}
  incidents.forEach(incident => {
    const dateKey = incident.startTime.toISOString().split('T')[0]
    if (!incidentsByDate[dateKey]) {
      incidentsByDate[dateKey] = []
    }
    incidentsByDate[dateKey].push({
      ...incident,
      endTime: incident.endTime || undefined
    })
  })

  // Convert daily stats to map
  const statsMap: { [key: string]: { total: number; successful: number } } = {}
  dailyStats.forEach(stat => {
    statsMap[stat.date] = {
      total: Number(stat.total),
      successful: Number(stat.successful)
    }
  })

  // Build result array
  const uptimeData: UptimeData[] = []
  let lastKnownUptime = 100 // Assume 100% if no previous data

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (days - 1 - i))
    date.setUTCHours(0, 0, 0, 0)
    const dateKey = date.toISOString().split('T')[0]

    const dayStats = statsMap[dateKey]
    let uptime: number

    if (dayStats && dayStats.total > 0) {
      uptime = (dayStats.successful / dayStats.total) * 100
      lastKnownUptime = uptime // Update last known uptime
    } else {
      // Pas de données pour ce jour - maintenir la continuité avec le dernier statut connu
      const hasIncidents = incidentsByDate[dateKey] && incidentsByDate[dateKey].length > 0

      if (hasIncidents) {
        // S'il y a des incidents, réduire l'uptime
        uptime = Math.max(lastKnownUptime * 0.8, 0) // Réduire de 20%
        lastKnownUptime = uptime
      } else {
        // Pas de données, pas d'incidents - maintenir le statut précédent
        uptime = lastKnownUptime
      }
    }

    uptimeData.push({
      date: dateKey,
      uptime: Math.round(uptime * 100) / 100,
      incidents: incidentsByDate[dateKey] || []
    })
  }

  return uptimeData
}

// Optimized version for multiple services
export async function getBulkUptimeHistory(serviceIds: string[], days: number = 30) {
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  // Get all stats in one query
  const allStats = await prisma.$queryRaw<Array<{
    serviceId: string
    date: string
    total: bigint
    successful: bigint
  }>>`
    SELECT 
      c."serviceId",
      DATE(cr."timestamp") as date,
      COUNT(*) as total,
      COUNT(CASE WHEN cr."success" = true THEN 1 END) as successful
    FROM "check_results" cr
    INNER JOIN "checks" c ON cr."checkId" = c."id"
    WHERE c."serviceId" = ANY(${serviceIds})
      AND cr."timestamp" >= ${startDate}
    GROUP BY c."serviceId", DATE(cr."timestamp")
    ORDER BY c."serviceId", date
  `

  // Get all incidents in one query
  const allIncidents = await prisma.incident.findMany({
    where: {
      serviceId: { in: serviceIds },
      startTime: { gte: startDate }
    },
    select: {
      serviceId: true,
      id: true,
      title: true,
      status: true,
      severity: true,
      startTime: true,
      endTime: true
    }
  })

  // Process results
  const result: Record<string, UptimeData[]> = {}
  
  // Group data by service
  const statsByService: Record<string, Record<string, { total: number; successful: number }>> = {}
  const incidentsByService: Record<string, Record<string, any[]>> = {}
  
  // Initialize
  serviceIds.forEach(serviceId => {
    statsByService[serviceId] = {}
    incidentsByService[serviceId] = {}
  })
  
  // Process stats
  allStats.forEach(stat => {
    if (!statsByService[stat.serviceId][stat.date]) {
      statsByService[stat.serviceId][stat.date] = {
        total: Number(stat.total),
        successful: Number(stat.successful)
      }
    }
  })
  
  // Process incidents
  allIncidents.forEach(incident => {
    const dateKey = incident.startTime.toISOString().split('T')[0]
    const serviceId = incident.serviceId
    if (serviceId && !incidentsByService[serviceId][dateKey]) {
      incidentsByService[serviceId][dateKey] = []
    }
    if (serviceId) {
      incidentsByService[serviceId][dateKey].push({
        id: incident.id,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        startTime: incident.startTime,
        endTime: incident.endTime || undefined
      })
    }
  })
  
  // Build results for each service
  serviceIds.forEach(serviceId => {
    const uptimeData: UptimeData[] = []
    let lastKnownUptime = 100 // Assume 100% if no previous data

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setUTCDate(date.getUTCDate() - (days - 1 - i))
      date.setUTCHours(0, 0, 0, 0)
      const dateKey = date.toISOString().split('T')[0]

      const dayStats = statsByService[serviceId][dateKey]
      let uptime: number

      if (dayStats && dayStats.total > 0) {
        uptime = (dayStats.successful / dayStats.total) * 100
        lastKnownUptime = uptime // Update last known uptime
      } else {
        // Pas de données pour ce jour - maintenir la continuité avec le dernier statut connu
        const hasIncidents = incidentsByService[serviceId][dateKey] && incidentsByService[serviceId][dateKey].length > 0

        if (hasIncidents) {
          // S'il y a des incidents, réduire l'uptime
          uptime = Math.max(lastKnownUptime * 0.8, 0) // Réduire de 20%
          lastKnownUptime = uptime
        } else {
          // Pas de données, pas d'incidents - maintenir le statut précédent
          uptime = lastKnownUptime
        }
      }

      uptimeData.push({
        date: dateKey,
        uptime: Math.round(uptime * 100) / 100,
        incidents: incidentsByService[serviceId][dateKey] || []
      })
    }
    
    result[serviceId] = uptimeData
  })
  
  return result
}