import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { IncidentSeverity, IncidentStatus } from '@prisma/client'

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: z.nativeEnum(IncidentSeverity),
  isScheduled: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  serviceId: z.string().cuid().optional(),
  machineId: z.string().cuid().optional(),
  tags: z.array(z.string()).default([])
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

    const incident = await prisma.incident.create({
      data: {
        ...data,
        slug,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        eta: data.eta ? new Date(data.eta) : undefined,
        status: data.isScheduled ? IncidentStatus.SCHEDULED : IncidentStatus.INVESTIGATING,
        createdBy: auth.user!.userId,
        updates: {
          create: {
            title: 'Incident Created',
            message: data.description
          }
        }
      },
      include: {
        updates: true,
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