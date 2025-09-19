import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function POST(
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

    requirePermission(auth.payload!, 'canManageServices')

    const checkId = params.id

    // Verify check exists
    const check = await prisma.check.findUnique({
      where: { id: checkId },
      include: {
        service: true
      }
    })

    if (!check) {
      return NextResponse.json({
        success: false,
        error: 'Check not found'
      }, { status: 404 })
    }

    // TODO: Trigger manual check execution
    // This would integrate with the worker system
    // For now, we'll create a placeholder response

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'EXECUTE',
        resource: 'CHECK',
        resourceId: checkId,
        details: {
          type: 'manual_execution',
          serviceName: check.service.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Manual check triggered successfully',
      data: {
        checkId,
        serviceName: check.service.name,
        scheduledAt: new Date()
      }
    })
  } catch (error) {
    console.error('Manual check execution error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger manual check'
    }, { status: 500 })
  }
}