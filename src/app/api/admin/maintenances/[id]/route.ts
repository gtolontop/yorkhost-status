import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  affectedServices: z.array(z.string()).optional()
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const existing = await prisma.incident.findUnique({
      where: { id: params.id }
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
      where: { id: params.id },
      data: {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        updatedAt: new Date()
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Verify maintenance exists and is of type MAINTENANCE
    const existing = await prisma.incident.findUnique({
      where: { id: params.id }
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
      where: { id: params.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'MAINTENANCE',
        resourceId: params.id,
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