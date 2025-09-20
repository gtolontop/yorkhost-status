import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
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

    const { id: serviceId } = await params

    // Get service with its checks
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

    // If no checks exist, create a basic HTTP check
    let check = service.checks[0]
    if (!check && service.url) {
      check = await prisma.check.create({
        data: {
          serviceId: serviceId,
          name: `${service.name} HTTP Check`,
          type: 'HTTP',
          target: service.url,
          timeout: 30000,
          interval: 300, // 5 minutes
          isActive: true
        }
      })
    }

    if (!check) {
      return NextResponse.json({
        success: false,
        error: 'No check configuration found for this service'
      }, { status: 400 })
    }

    // Perform the actual check using the proper monitoring logic
    let checkResult
    try {
      checkResult = await executeCheck(
        check.type,
        check.target,
        check.port,
        check.timeout * 1000 // Convert seconds to milliseconds
      )
    } catch (err) {
      checkResult = {
        success: false,
        responseTime: 0,
        error: err instanceof Error ? err.message : 'Check failed'
      }
    }

    // Save check result
    const savedResult = await prisma.checkResult.create({
      data: {
        checkId: check.id,
        success: checkResult.success,
        responseTime: checkResult.responseTime,
        error: checkResult.error,
        timestamp: new Date()
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
          name: service.name,
          action: 'manual_check',
          success: checkResult.success,
          responseTime: checkResult.responseTime
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        checkResult: {
          success: checkResult.success,
          responseTime: checkResult.responseTime,
          error: checkResult.error,
          timestamp: savedResult.timestamp
        }
      }
    })
  } catch (error) {
    console.error('Manual check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform manual check'
    }, { status: 500 })
  }
}