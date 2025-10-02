import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { IncidentSeverity, IncidentStatus } from '@prisma/client'

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: z.nativeEnum(IncidentSeverity),
  status: z.nativeEnum(IncidentStatus).optional(),
  impact: z.string().optional(),
  isScheduled: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  affectedServices: z.array(z.string()).default([]),
  serviceId: z.string().cuid().optional(),
  machineId: z.string().cuid().optional(),
  tags: z.array(z.string()).default([]),
  updates: z.array(z.object({
    title: z.string().optional(),
    message: z.string().min(1),
    status: z.string().optional(),
    timestamp: z.string().datetime(),
    isStatusChange: z.boolean().optional()
  })).default([])
})

const updateIncidentSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(1)
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const incidents = await prisma.incident.findMany({
      where: {
        type: 'INCIDENT'
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        },
        machine: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: incidents
    })
  } catch (error) {
    console.error('Admin incidents fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incidents'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Permission check disabled for now

    const body = await request.json()
    const data = createIncidentSchema.parse(body)

    // Verify service/machine exists if provided
    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId }
      })
      if (!service) {
        return NextResponse.json({
          success: false,
          error: 'Service not found'
        }, { status: 404 })
      }
    }

    if (data.machineId) {
      const machine = await prisma.machine.findUnique({
        where: { id: data.machineId }
      })
      if (!machine) {
        return NextResponse.json({
          success: false,
          error: 'Machine not found'
        }, { status: 404 })
      }
    }

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' + Date.now()

    // Create incident with all affected services
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        slug,
        type: 'INCIDENT',
        severity: data.severity,
        status: data.status || (data.isScheduled ? IncidentStatus.SCHEDULED : IncidentStatus.INVESTIGATING),
        impact: data.impact || null,
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : null,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        eta: data.eta ? new Date(data.eta) : undefined,
        isScheduled: data.isScheduled,
        serviceId: data.serviceId || null,
        machineId: data.machineId || null,
        tags: data.tags,
        createdBy: auth.user!.userId,
        affectedServices: data.affectedServices,
        updates: {
          create: data.updates.length > 0 ? data.updates.map(u => ({
            title: u.title || null,
            message: u.message,
            status: u.status || null,
            timestamp: new Date(u.timestamp),
            isStatusChange: u.isStatusChange || false,
            authorId: auth.user!.userId
          })) : [{
            title: 'Incident Created',
            message: data.description,
            timestamp: data.startTime ? new Date(data.startTime) : new Date(),
            authorId: auth.user!.userId
          }]
        }
      },
      include: {
        updates: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
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
        action: 'CREATE',
        resource: 'INCIDENT',
        resourceId: incident.id,
        details: {
          title: incident.title,
          severity: incident.severity,
          serviceId: incident.serviceId
        }
      }
    })

    // TODO: Send real-time notification

    return NextResponse.json({
      success: true,
      data: incident
    })
  } catch (error) {
    console.error('Create incident error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create incident'
    }, { status: 500 })
  }
}