import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const maintenances = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE'
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    // Get all unique service IDs from all maintenances
    const serviceIds = new Set<string>()
    maintenances.forEach(maintenance => {
      maintenance.affectedServices.forEach(serviceId => {
        serviceIds.add(serviceId)
      })
    })

    // Fetch all services in one query
    const services = await prisma.service.findMany({
      where: {
        id: { in: Array.from(serviceIds) }
      },
      select: {
        id: true,
        name: true
      }
    })

    // Create a map of service ID to service name
    const serviceMap = new Map(services.map(service => [service.id, service.name]))

    // Transform the maintenances to include service names
    const maintenancesWithServiceNames = maintenances.map(maintenance => ({
      ...maintenance,
      affectedServicesWithNames: maintenance.affectedServices.map(serviceId => ({
        id: serviceId,
        name: serviceMap.get(serviceId) || serviceId // fallback to ID if name not found
      }))
    }))

    return NextResponse.json({
      success: true,
      data: maintenancesWithServiceNames
    })
  } catch (error) {
    console.error('Maintenance API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maintenances'
    }, { status: 500 })
  }
}