import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { groups } = await request.json()

    console.log('Reorder request received:', groups)

    if (!Array.isArray(groups)) {
      return NextResponse.json({ success: false, error: 'Invalid groups data' }, { status: 400 })
    }

    // Update each group's order
    const updatePromises = groups.map((group: { id: string, order: number }) => {
      if (group.id === 'ungrouped') {
        return Promise.resolve()
      }
      console.log(`Updating group ${group.id} with order ${group.order}`)
      return prisma.machine.update({
        where: { id: group.id },
        data: { order: group.order }
      })
    })

    const results = await Promise.all(updatePromises)
    console.log('Update results:', results)

    return NextResponse.json({
      success: true,
      message: 'Groups reordered successfully'
    })
  } catch (error) {
    console.error('Groups reorder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reorder groups' }, { status: 500 })
  }
}