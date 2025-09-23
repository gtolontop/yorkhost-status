import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createMaintenanceUpdateSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(1),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']).optional()
})

export async function POST(
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

    const { id: maintenanceId } = await params
    const body = await request.json()
    const data = createMaintenanceUpdateSchema.parse(body)

    // Verify maintenance exists and is of type MAINTENANCE
    const maintenance = await prisma.incident.findUnique({
      where: { id: maintenanceId }
    })

    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Maintenance not found'
      }, { status: 404 })
    }

    if (maintenance.type !== 'MAINTENANCE') {
      return NextResponse.json({
        success: false,
        error: 'This is not a maintenance record'
      }, { status: 400 })
    }

    // Get user details for author name
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
      select: { username: true }
    })

    // Create the update
    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId: maintenanceId,
        title: data.title,
        message: data.message,
        status: data.status,
        authorId: auth.user!.userId,
        authorName: user?.username || 'Unknown',
        isStatusChange: !!data.status
      }
    })

    // Update maintenance status if provided
    if (data.status) {
      await prisma.incident.update({
        where: { id: maintenanceId },
        data: {
          status: data.status,
          // Set endTime if completing maintenance
          endTime: data.status === 'COMPLETED' ? new Date() : undefined
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'MAINTENANCE',
        resourceId: maintenanceId,
        details: {
          updateType: 'maintenance_update',
          message: data.message,
          status: data.status
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: update
    })
  } catch (error) {
    console.error('Create maintenance update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create maintenance update'
    }, { status: 500 })
  }
}