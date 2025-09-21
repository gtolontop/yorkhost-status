import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function DELETE(
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

    const { id: incidentId } = await params

    // Check if incident exists and get full details for audit log
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        updates: true,
        service: true,
        machine: true
      }
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

    // Create detailed audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'INCIDENT',
        resourceId: incidentId,
        details: {
          title: incident.title,
          status: incident.status,
          severity: incident.severity,
          serviceName: incident.service?.name,
          machineName: incident.machine?.name,
          updatesCount: incident.updates.length,
          createdAt: incident.startTime,
          endTime: incident.endTime
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

    const { id: incidentId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.severity || !body.status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, description, severity, and status are required'
      }, { status: 400 })
    }

    // Get the current incident to check for status changes
    const currentIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!currentIncident) {
      return NextResponse.json({
        success: false,
        error: 'Incident not found'
      }, { status: 404 })
    }

    // Check if status has changed
    const statusChanged = currentIncident.status !== body.status

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
        tags: body.tags,
        serviceId: body.serviceId || currentIncident.serviceId,
        machineId: body.machineId || currentIncident.machineId
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

    // Create status update if status changed and message provided
    if (statusChanged && body.statusUpdateMessage) {
      await prisma.incidentUpdate.create({
        data: {
          incidentId: incidentId,
          status: body.status,
          message: body.statusUpdateMessage,
          authorId: auth.user!.userId
        }
      })
    }

    // Create audit log with enhanced details
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'INCIDENT',
        resourceId: incidentId,
        details: {
          title: incident.title,
          previousStatus: currentIncident.status,
          newStatus: incident.status,
          statusChanged: statusChanged,
          severity: incident.severity,
          serviceChanged: currentIncident.serviceId !== incident.serviceId
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