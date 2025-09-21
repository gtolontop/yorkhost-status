import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateServiceStatus, calculateUptime, getLatestResponseTime, getLastCheckTime } from '@/lib/status-calculator'
import { executeCheck } from '@/lib/monitoring/checker'

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['HTTP', 'HTTPS', 'TCP', 'ICMP', 'DNS']),
  target: z.string().min(1),
  port: z.union([z.number().int().min(1).max(65535), z.null()]).optional(),
  interval: z.number().int().min(10).default(60),
  timeout: z.number().int().min(1).max(300).default(10)
}).refine((data) => {
  // TCP requires a port
  if (data.type === 'TCP' && (!data.port || data.port === null)) {
    return false
  }
  // ICMP and DNS don't need ports
  if ((data.type === 'ICMP' || data.type === 'DNS') && data.port) {
    return false
  }
  return true
}, {
  message: "Invalid port configuration for selected monitor type",
  path: ["port"]
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      include: {
        machine: true,
        checks: {
          orderBy: { createdAt: 'desc' },
          include: {
            results: {
              orderBy: { timestamp: 'desc' },
              take: 20
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Transform services with consistent status calculation
    const transformedServices = services.map(service => {
      const allResults = service.checks.flatMap(check => check.results)
      
      // Use shared status calculation logic
      const status = calculateServiceStatus(allResults)
      const uptime = calculateUptime(allResults)
      const responseTime = getLatestResponseTime(allResults)
      const lastCheck = getLastCheckTime(allResults)

      return {
        ...service,
        status,
        uptime,
        responseTime,
        lastCheck,
        // Keep original structure for compatibility
        checks: service.checks.map(check => ({
          ...check,
          results: check.results.slice(0, 1) // Keep only latest for frontend compatibility
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedServices
    })
  } catch (error) {
    console.error('Admin services fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Permission check disabled for now

    const body = await request.json()
    const data = createServiceSchema.parse(body)

    // Create service without machine assignment
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.type === 'HTTP' ? data.target : null
      },
      include: {
        machine: true,
        checks: true
      }
    })

    // Create monitoring check
    const check = await prisma.check.create({
      data: {
        name: `${data.name} Monitor`,
        type: data.type as any, // Convert string to CheckType enum
        target: data.target,
        port: data.port,
        timeout: data.timeout,
        interval: data.interval,
        serviceId: service.id,
        isActive: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'CREATE',
        resource: 'SERVICE',
        resourceId: service.id,
        details: {
          name: service.name
        }
      }
    })

    // Perform initial check (but don't fail if it doesn't work)
    try {
      console.log('Performing initial check for:', check.name, check.type, check.target)
      const checkResult = await executeCheck(check.type, check.target, check.port, check.timeout)
      
      // Save the check result
      await prisma.checkResult.create({
        data: {
          checkId: check.id,
          success: checkResult.success,
          responseTime: checkResult.responseTime || null,
          statusCode: checkResult.statusCode || null,
          error: checkResult.error || null
        }
      })
      console.log('Initial check completed:', checkResult)
    } catch (error) {
      console.error('Initial check failed (non-fatal):', error)
      // Create a failed check result
      await prisma.checkResult.create({
        data: {
          checkId: check.id,
          success: false,
          responseTime: null,
          statusCode: null,
          error: error instanceof Error ? error.message : 'Initial check failed'
        }
      })
    }

    // Fetch the service with updated data
    const updatedService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        machine: true,
        checks: {
          include: {
            results: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedService
    })
  } catch (error) {
    console.error('Create service error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create service'
    }, { status: 500 })
  }
}