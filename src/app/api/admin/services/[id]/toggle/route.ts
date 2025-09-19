import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

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

    const { id: serviceId } = await params

    // Get current service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        checks: true
      }
    })

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    // Toggle all checks for this service
    const newActiveState = service.checks.length > 0 ? !service.checks[0].isActive : true

    await prisma.check.updateMany({
      where: { serviceId: serviceId },
      data: { isActive: newActiveState }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'SERVICE',
        resourceId: serviceId,
        details: {
          name: service.name,
          action: newActiveState ? 'activated' : 'deactivated'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { active: newActiveState }
    })
  } catch (error) {
    console.error('Toggle service error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle service status'
    }, { status: 500 })
  }
}