import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const incidentId = params.id

    // Check if incident exists
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    })

    if (!incident) {
      return NextResponse.json({
        success: false,
        error: 'Incident not found'
      }, { status: 404 })
    }

    // Delete related updates first
    await prisma.incidentUpdate.deleteMany({
      where: { incidentId: incidentId }
    })

    // Delete the incident
    await prisma.incident.delete({
      where: { id: incidentId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'INCIDENT',
        resourceId: incidentId,
        details: {
          title: incident.title
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully'
    })
  } catch (error) {
    console.error('Delete incident error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete incident'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const incidentId = params.id
    const body = await request.json()

    // Update incident
    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: body.status,
        endTime: body.status === 'RESOLVED' ? new Date() : body.endTime,
        eta: body.eta,
        tags: body.tags
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
        resource: 'INCIDENT',
        resourceId: incidentId,
        details: {
          title: incident.title,
          status: incident.status
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: incident
    })
  } catch (error) {
    console.error('Update incident error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update incident'
    }, { status: 500 })
  }
}