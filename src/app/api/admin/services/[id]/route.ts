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

    const serviceId = params.id

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

    const serviceId = params.id
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