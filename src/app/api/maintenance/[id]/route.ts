import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch the maintenance
    const maintenance = await prisma.incident.findUnique({
      where: {
        id: id,
        type: 'MAINTENANCE'
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Maintenance not found'
      }, { status: 404 })
    }

    // Get all unique service IDs from the maintenance
    const serviceIds = new Set<string>()
    maintenance.affectedServices.forEach(serviceId => {
      serviceIds.add(serviceId)
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

    // Transform the maintenance to include service names
    const maintenanceWithServiceNames = {
      ...maintenance,
      affectedServicesWithNames: maintenance.affectedServices.map(serviceId => ({
        id: serviceId,
        name: serviceMap.get(serviceId) || serviceId // fallback to ID if name not found
      }))
    }

    return NextResponse.json({
      success: true,
      data: maintenanceWithServiceNames
    })
  } catch (error) {
    console.error('Maintenance detail API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maintenance'
    }, { status: 500 })
  }
}