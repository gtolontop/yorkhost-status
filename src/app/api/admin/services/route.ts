import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createServiceSchema = z.object({
  machineId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  url: z.string().url().optional(),
  icon: z.string().optional()
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

    // Verify machine exists
    const machine = await prisma.machine.findUnique({
      where: { id: data.machineId }
    })

    if (!machine) {
      return NextResponse.json({
        success: false,
        error: 'Machine not found'
      }, { status: 404 })
    }

    const service = await prisma.service.create({
      data,
      include: {
        machine: true,
        checks: true
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