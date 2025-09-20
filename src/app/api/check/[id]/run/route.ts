import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'

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

    // Permission check disabled for now

    const { id: checkId } = await params

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

    // Execute the actual check
    console.log(`Running ${check.type} check for ${check.target}:${check.port || 'N/A'}`)
    
    const result = await executeCheck(
      check.type,
      check.target,
      check.port,
      check.timeout
    )
    
    // Save the result
    await prisma.checkResult.create({
      data: {
        checkId: check.id,
        success: result.success,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error,
        timestamp: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
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
      message: 'Check executed successfully',
      data: {
        checkId,
        serviceName: check.service.name,
        result: {
          success: result.success,
          responseTime: result.responseTime,
          error: result.error
        },
        executedAt: new Date()
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