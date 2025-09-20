import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { performCheck } from '@/lib/monitoring/checker'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Get all services with their checks
    const services = await prisma.service.findMany({
      include: {
        checks: true
      }
    })

    const results = []

    for (const service of services) {
      try {
        // If no checks exist, create a basic HTTP check
        let check = service.checks[0]
        if (!check && service.url) {
          check = await prisma.check.create({
            data: {
              serviceId: service.id,
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
          results.push({
            serviceId: service.id,
            serviceName: service.name,
            success: false,
            error: 'No check configuration found'
          })
          continue
        }

        // Perform the actual check using the proper monitoring logic
        let checkResult
        try {
          checkResult = await performCheck(
            check.type,
            check.target,
            check.port,
            check.timeout
          )
        } catch (err) {
          checkResult = {
            success: false,
            responseTime: 0,
            error: err instanceof Error ? err.message : 'Check failed'
          }
        }

        // Save check result
        await prisma.checkResult.create({
          data: {
            checkId: check.id,
            success: checkResult.success,
            responseTime: checkResult.responseTime,
            error: checkResult.error,
            timestamp: new Date()
          }
        })

        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: checkResult.success,
          responseTime: checkResult.responseTime,
          error: checkResult.error
        })

      } catch (serviceError) {
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: false,
          error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        })
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'SERVICE',
        resourceId: 'bulk',
        details: {
          action: 'check_all_services',
          servicesChecked: services.length,
          results: results.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `Checked ${services.length} services`,
        results
      }
    })
  } catch (error) {
    console.error('Bulk check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform bulk check'
    }, { status: 500 })
  }
}