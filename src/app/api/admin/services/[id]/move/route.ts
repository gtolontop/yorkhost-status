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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { groupId, order } = await request.json()

    // Update service's machine assignment
    const service = await prisma.service.update({
      where: { id },
      data: {
        machineId: groupId === 'ungrouped' ? null : groupId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        serviceId: service.id,
        groupId: service.machineId || 'ungrouped',
        order
      }
    })
  } catch (error) {
    console.error('Move service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to move service' }, { status: 500 })
  }
}