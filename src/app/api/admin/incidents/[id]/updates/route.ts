import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createUpdateSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(1)
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

    requirePermission(auth.payload!, 'canManageIncidents')

    const { id: incidentId } = await params
    const body = await request.json()
    const data = createUpdateSchema.parse(body)

    // Verify incident exists
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    })

    if (!incident) {
      return NextResponse.json({
        success: false,
        error: 'Incident not found'
      }, { status: 404 })
    }

    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId,
        title: data.title,
        message: data.message,
        authorId: auth.user.id
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'UPDATE',
        resource: 'INCIDENT',
        resourceId: incidentId,
        details: {
          updateType: 'status_update',
          message: data.message
        }
      }
    })

    // TODO: Send real-time notification

    return NextResponse.json({
      success: true,
      data: update
    })
  } catch (error) {
    console.error('Create incident update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create incident update'
    }, { status: 500 })
  }
}