import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermission } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createMachineSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  location: z.string().optional(),
  tags: z.array(z.string()).default([])
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

    const machines = await prisma.machine.findMany({
      include: {
        services: {
          include: {
            checks: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: machines
    })
  } catch (error) {
    console.error('Admin machines fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch machines'
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
    const data = createMachineSchema.parse(body)

    const machine = await prisma.machine.create({
      data,
      include: {
        services: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'CREATE',
        resource: 'MACHINE',
        resourceId: machine.id,
        details: {
          name: machine.name,
          category: machine.category
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: machine
    })
  } catch (error) {
    console.error('Create machine error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create machine'
    }, { status: 500 })
  }
}