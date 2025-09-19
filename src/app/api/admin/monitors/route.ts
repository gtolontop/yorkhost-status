import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['HTTP', 'HTTPS', 'TCP', 'ICMP']),
  target: z.string().min(1),
  port: z.number().min(1).max(65535).optional(),
  timeout: z.number().min(1000).max(60000).default(10000),
  interval: z.number().min(30).max(3600).default(60),
  group: z.string().default('default')
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

    // Get all checks (monitors) with their latest results
    const monitors = await prisma.check.findMany({
      include: {
        service: {
          select: {
            id: true,
            name: true
          }
        },
        results: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Group monitors by group (using service name as group for now)
    const groupedMonitors: { [key: string]: any[] } = {}
    
    monitors.forEach(monitor => {
      const group = monitor.service?.name || 'default'
      if (!groupedMonitors[group]) {
        groupedMonitors[group] = []
      }
      
      const latestResult = monitor.results[0]
      groupedMonitors[group].push({
        id: monitor.id,
        name: monitor.name,
        type: monitor.type,
        target: monitor.target,
        port: monitor.port,
        timeout: monitor.timeout,
        interval: monitor.interval,
        isActive: monitor.isActive,
        group,
        status: latestResult?.success ? 'up' : 'down',
        responseTime: latestResult?.responseTime || 0,
        lastCheck: latestResult?.timestamp?.toISOString() || new Date().toISOString(),
        uptime: calculateUptime(monitor.results),
        history: monitor.results.slice(0, 20).map(r => ({
          timestamp: r.timestamp.toISOString(),
          success: r.success,
          responseTime: r.responseTime || 0,
          error: r.error
        }))
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        groups: Object.keys(groupedMonitors).map(name => ({
          name,
          monitors: groupedMonitors[name]
        }))
      }
    })
  } catch (error) {
    console.error('Monitors fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitors'
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

    const body = await request.json()
    const data = createMonitorSchema.parse(body)

    // First create a service if it doesn't exist (for grouping)
    let service = await prisma.service.findFirst({
      where: { name: data.group }
    })

    if (!service) {
      // Create a default machine first
      let machine = await prisma.machine.findFirst({
        where: { name: 'Default' }
      })

      if (!machine) {
        machine = await prisma.machine.create({
          data: {
            name: 'Default',
            description: 'Machine par défaut pour les monitors',
            category: 'monitoring'
          }
        })
      }

      service = await prisma.service.create({
        data: {
          name: data.group,
          description: `Groupe de monitoring: ${data.group}`,
          machineId: machine.id
        }
      })
    }

    // Create the check (monitor)
    const monitor = await prisma.check.create({
      data: {
        serviceId: service.id,
        name: data.name,
        type: data.type as any,
        target: data.target,
        port: data.port,
        timeout: data.timeout,
        interval: data.interval,
        isActive: true
      },
      include: {
        service: {
          select: {
            id: true,
            name: true
          }
        },
        results: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'CREATE',
        resource: 'MONITOR',
        resourceId: monitor.id,
        details: {
          name: monitor.name,
          type: monitor.type,
          target: monitor.target,
          group: data.group
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: monitor
    })
  } catch (error) {
    console.error('Create monitor error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create monitor'
    }, { status: 500 })
  }
}

function calculateUptime(results: any[]) {
  if (results.length === 0) return 100
  const successful = results.filter(r => r.success).length
  return Math.round((successful / results.length) * 100 * 100) / 100
}