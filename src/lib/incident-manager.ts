import { prisma } from '@/lib/db'

interface IncidentCheckResult {
  serviceId: string
  serviceName: string
  checkId: string
  success: boolean
  timestamp: Date
  error?: string
}

export async function handleCheckResult(result: IncidentCheckResult) {
  try {
    // Get active incident for this service
    const activeIncident = await prisma.incident.findFirst({
      where: {
        serviceId: result.serviceId,
        status: 'active'
      }
    })

    if (!result.success && !activeIncident) {
      // Service just went down - create incident
      console.log(`[INCIDENT] Creating incident for ${result.serviceName}`)
      
      await prisma.incident.create({
        data: {
          serviceId: result.serviceId,
          title: `${result.serviceName} is down`,
          status: 'active',
          severity: 'major',
          startTime: result.timestamp,
          description: result.error || 'Service is not responding'
        }
      })

      // Create incident update
      await prisma.incidentUpdate.create({
        data: {
          incidentId: activeIncident?.id || '', // Will be updated
          content: 'Service went down',
          status: 'monitoring'
        }
      })
    } else if (result.success && activeIncident) {
      // Service is back up - resolve incident
      const downtime = result.timestamp.getTime() - activeIncident.startTime.getTime()
      const downtimeMinutes = Math.floor(downtime / 60000)
      const downtimeHours = Math.floor(downtimeMinutes / 60)
      const downtimeText = downtimeHours > 0 
        ? `${downtimeHours}h ${downtimeMinutes % 60}m`
        : `${downtimeMinutes}m`

      console.log(`[INCIDENT] Resolving incident for ${result.serviceName} - was down for ${downtimeText}`)
      
      await prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          status: 'resolved',
          endTime: result.timestamp
        }
      })

      // Add resolution update
      await prisma.incidentUpdate.create({
        data: {
          incidentId: activeIncident.id,
          content: `Service restored after ${downtimeText} of downtime`,
          status: 'resolved'
        }
      })
    }
  } catch (error) {
    console.error('[INCIDENT] Error handling check result:', error)
  }
}

export async function getRecentIncidents(serviceId?: string, limit: number = 10) {
  const where = serviceId ? { serviceId } : {}
  
  const incidents = await prisma.incident.findMany({
    where,
    orderBy: { startTime: 'desc' },
    take: limit,
    include: {
      service: true,
      updates: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  return incidents.map(incident => {
    const duration = incident.endTime 
      ? incident.endTime.getTime() - incident.startTime.getTime()
      : Date.now() - incident.startTime.getTime()
    
    const durationMinutes = Math.floor(duration / 60000)
    const durationHours = Math.floor(durationMinutes / 60)
    const durationText = durationHours > 0 
      ? `${durationHours}h ${durationMinutes % 60}m`
      : `${durationMinutes}m`

    return {
      ...incident,
      duration,
      durationText,
      isActive: incident.status === 'active'
    }
  })
}