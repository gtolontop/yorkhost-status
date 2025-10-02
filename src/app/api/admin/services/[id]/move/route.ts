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

    // Update service's machine assignment and order
    const service = await prisma.service.update({
      where: { id },
      data: {
        machineId: groupId === 'ungrouped' ? null : groupId,
        order: order !== undefined ? order : 0
      }
    })

    // If order is provided, reorder other services in the same group
    if (order !== undefined) {
      const targetGroupId = groupId === 'ungrouped' ? null : groupId

      // Get all services in the target group
      const servicesInGroup = await prisma.service.findMany({
        where: {
          machineId: targetGroupId,
          id: { not: id }
        },
        orderBy: { order: 'asc' }
      })

      // Reorder services: shift services at or after the new position
      const updates = servicesInGroup.map((s, idx) => {
        let newOrder = idx
        if (idx >= order) {
          newOrder = idx + 1
        }
        return prisma.service.update({
          where: { id: s.id },
          data: { order: newOrder }
        })
      })

      await Promise.all(updates)
    }

    return NextResponse.json({
      success: true,
      data: {
        serviceId: service.id,
        groupId: service.machineId || 'ungrouped',
        order: service.order
      }
    })
  } catch (error) {
    console.error('Move service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to move service' }, { status: 500 })
  }
}