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

    const { id: machineId } = await params

    // Check if machine exists
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: {
        services: true
      }
    })

    if (!machine) {
      return NextResponse.json({
        success: false,
        error: 'Machine not found'
      }, { status: 404 })
    }

    // Check if machine has services
    if (machine.services.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete machine with active services. Please remove services first.'
      }, { status: 400 })
    }

    // Delete the machine
    await prisma.machine.delete({
      where: { id: machineId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'MACHINE',
        resourceId: machineId,
        details: {
          name: machine.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Machine deleted successfully'
    })
  } catch (error) {
    console.error('Delete machine error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete machine'
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

    const { id: machineId } = await params
    const body = await request.json()

    // Update machine
    const machine = await prisma.machine.update({
      where: { id: machineId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        location: body.location,
        tags: body.tags || []
      },
      include: {
        services: {
          include: {
            checks: {
              include: {
                results: {
                  take: 1,
                  orderBy: { timestamp: 'desc' }
                }
              }
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
        resource: 'MACHINE',
        resourceId: machineId,
        details: {
          name: machine.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: machine
    })
  } catch (error) {
    console.error('Update machine error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update machine'
    }, { status: 500 })
  }
}