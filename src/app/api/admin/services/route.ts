import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['HTTP', 'HTTPS', 'TCP', 'ICMP', 'DNS']),
  target: z.string().min(1),
  port: z.union([z.number().int().min(1).max(65535), z.null()]).optional(),
  interval: z.number().int().min(10).default(60),
  timeout: z.number().int().min(1).max(300).default(10),
  group: z.string().default('other')
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
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: services
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

    // Create or find machine based on target and group
    let machine = await prisma.machine.findFirst({
      where: {
        name: `${data.target} (${data.type})`,
        category: data.group
      }
    })

    if (!machine) {
      machine = await prisma.machine.create({
        data: {
          name: `${data.target} (${data.type})`,
          category: data.group,
          location: data.target,
          description: `Auto-created for ${data.name} monitoring`,
          isActive: true
        }
      })
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        machineId: machine.id,
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
          name: service.name,
          machineId: service.machineId
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: service
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