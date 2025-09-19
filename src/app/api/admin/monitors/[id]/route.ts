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

    const { id: monitorId } = await params

    // Check if monitor exists
    const monitor = await prisma.check.findUnique({
      where: { id: monitorId }
    })

    if (!monitor) {
      return NextResponse.json({
        success: false,
        error: 'Monitor not found'
      }, { status: 404 })
    }

    // Delete related check results first
    await prisma.checkResult.deleteMany({
      where: { checkId: monitorId }
    })

    // Delete the monitor (check)
    await prisma.check.delete({
      where: { id: monitorId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'MONITOR',
        resourceId: monitorId,
        details: {
          name: monitor.name,
          target: monitor.target
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Monitor deleted successfully'
    })
  } catch (error) {
    console.error('Delete monitor error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete monitor'
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

    const { id: monitorId } = await params
    const body = await request.json()

    // Update monitor
    const monitor = await prisma.check.update({
      where: { id: monitorId },
      data: {
        name: body.name,
        target: body.target,
        port: body.port,
        timeout: body.timeout,
        interval: body.interval,
        isActive: body.isActive
      },
      include: {
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'MONITOR',
        resourceId: monitorId,
        details: {
          name: monitor.name,
          target: monitor.target
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: monitor
    })
  } catch (error) {
    console.error('Update monitor error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update monitor'
    }, { status: 500 })
  }
}