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

    const { id: serviceId } = await params

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    // Delete related data first (cascade should handle this, but being explicit)
    await prisma.checkResult.deleteMany({
      where: {
        check: {
          serviceId: serviceId
        }
      }
    })

    await prisma.check.deleteMany({
      where: { serviceId: serviceId }
    })

    // Delete the service
    await prisma.service.delete({
      where: { id: serviceId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'SERVICE',
        resourceId: serviceId,
        details: {
          name: service.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    })
  } catch (error) {
    console.error('Delete service error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete service'
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

    const { id: serviceId } = await params
    const body = await request.json()

    // Update service
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: body.name,
        description: body.description,
        url: body.url,
        icon: body.icon
      },
      include: {
        machine: true,
        checks: {
          include: {
            results: {
              take: 1,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'SERVICE',
        resourceId: serviceId,
        details: {
          name: service.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: service
    })
  } catch (error) {
    console.error('Update service error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update service'
    }, { status: 500 })
  }
}

export async function PATCH(
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

    const { id: serviceId } = await params
    const body = await request.json()

    // If changing group, update the machine category as well
    if (body.group) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { machine: true }
      })

      if (service) {
        // Update machine category to match new group
        await prisma.machine.update({
          where: { id: service.machineId },
          data: { category: body.group }
        })
      }
    }

    // Update service with partial data
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: body,
      include: {
        machine: true,
        checks: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'SERVICE',
        resourceId: serviceId,
        details: {
          name: updatedService.name,
          changes: body
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedService
    })
  } catch (error) {
    console.error('Patch service error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update service'
    }, { status: 500 })
  }
}