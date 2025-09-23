import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { IncidentSeverity, IncidentStatus } from '@prisma/client'

const createMaintenanceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: z.nativeEnum(IncidentSeverity).default('MEDIUM'),
  scheduledFor: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  impact: z.string().optional(),
  affectedServices: z.array(z.string()).default([])
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

    // Fetch only MAINTENANCE type incidents
    const maintenances = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE'
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
      data: maintenances
    })
  } catch (error) {
    console.error('Admin maintenances fetch error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maintenances'
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

    const body = await request.json()
    const data = createMaintenanceSchema.parse(body)

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' + Date.now()

    const maintenance = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        slug,
        type: 'MAINTENANCE',
        severity: data.severity,
        status: IncidentStatus.SCHEDULED,
        scheduledFor: new Date(data.scheduledFor),
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        isScheduled: true,
        createdBy: auth.user!.userId,
        affectedServices: data.affectedServices,
        updates: {
          create: {
            title: 'Maintenance Scheduled',
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
        resource: 'MAINTENANCE',
        resourceId: maintenance.id,
        details: {
          title: maintenance.title,
          scheduledFor: maintenance.scheduledFor,
          scheduledEnd: maintenance.scheduledEnd
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: maintenance
    })
  } catch (error) {
    console.error('Create maintenance error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create maintenance'
    }, { status: 500 })
  }
}