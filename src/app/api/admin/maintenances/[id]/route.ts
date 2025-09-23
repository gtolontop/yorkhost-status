import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { IncidentStatus } from '@prisma/client'

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  affectedServices: z.array(z.string()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

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
    console.error('Get maintenance error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maintenance'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const data = updateMaintenanceSchema.parse(body)

    // Verify maintenance exists and is of type MAINTENANCE
    const { id } = await params
    const existing = await prisma.incident.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Maintenance not found'
      }, { status: 404 })
    }

    if (existing.type !== 'MAINTENANCE') {
      return NextResponse.json({
        success: false,
        error: 'This is not a maintenance record'
      }, { status: 400 })
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status ? (data.status as IncidentStatus) : undefined,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        affectedServices: data.affectedServices
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'MAINTENANCE',
        resourceId: updated.id,
        details: data
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Update maintenance error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update maintenance'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Verify maintenance exists and is of type MAINTENANCE
    const { id } = await params
    const existing = await prisma.incident.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Maintenance not found'
      }, { status: 404 })
    }

    if (existing.type !== 'MAINTENANCE') {
      return NextResponse.json({
        success: false,
        error: 'This is not a maintenance record'
      }, { status: 400 })
    }

    await prisma.incident.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'MAINTENANCE',
        resourceId: id,
        details: {
          title: existing.title
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Maintenance deleted successfully'
    })
  } catch (error) {
    console.error('Delete maintenance error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete maintenance'
    }, { status: 500 })
  }
}