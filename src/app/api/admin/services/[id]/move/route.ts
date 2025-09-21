import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, order } = await request.json()

    // For now, just return success
    // When DB is migrated, we'll update the service's groupId and order
    
    return NextResponse.json({
      success: true,
      data: {
        serviceId: params.id,
        groupId,
        order
      }
    })
  } catch (error) {
    console.error('Move service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to move service' }, { status: 500 })
  }
}