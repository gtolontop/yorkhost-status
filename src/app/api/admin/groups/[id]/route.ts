import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const { id: groupId } = await params

    // Check if the group exists
    const group = await prisma.machine.findUnique({
      where: { id: groupId },
      include: {
        services: true
      }
    })

    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }

    // Move all services from this group to null (ungrouped)
    await prisma.service.updateMany({
      where: { machineId: groupId },
      data: { machineId: null }
    })

    // Delete the group
    await prisma.machine.delete({
      where: { id: groupId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'DELETE',
        resource: 'MACHINE',
        resourceId: groupId,
        details: {
          name: group.name,
          servicesCount: group.services.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Group deleted successfully. ${group.services.length} services moved to ungrouped.`
    })
  } catch (error) {
    console.error('Delete group error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete group'
    }, { status: 500 })
  }
}