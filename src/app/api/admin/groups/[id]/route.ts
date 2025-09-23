import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isExpandedByDefault: z.boolean().optional()
})

export async function PUT(
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
    const body = await request.json()
    const data = updateGroupSchema.parse(body)

    // Check if the group exists
    const group = await prisma.machine.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }

    // Prepare updated tags
    let tags = [...group.tags]

    // Update color tag if provided
    if (data.color) {
      tags = tags.filter(tag => !tag.startsWith('color:'))
      tags.push(`color:${data.color}`)
    }

    // Update collapsed tag based on isExpandedByDefault
    if (data.isExpandedByDefault !== undefined) {
      if (data.isExpandedByDefault) {
        tags = tags.filter(tag => tag !== 'collapsed')
      } else {
        if (!tags.includes('collapsed')) {
          tags.push('collapsed')
        }
      }
    }

    // Update the group
    const updatedGroup = await prisma.machine.update({
      where: { id: groupId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        tags
      },
      include: {
        services: true
      }
    })

    // Extract color from tags
    const colorTag = updatedGroup.tags.find(tag => tag.startsWith('color:'))
    const color = colorTag ? colorTag.replace('color:', '') : '#6b7280'
    const isExpandedByDefault = !updatedGroup.tags.includes('collapsed')

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user!.userId,
        action: 'UPDATE',
        resource: 'MACHINE',
        resourceId: groupId,
        details: {
          changes: data,
          name: updatedGroup.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description || '',
        color,
        order: updatedGroup.order || 0,
        servicesCount: updatedGroup.services.length,
        isExpandedByDefault
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 })
    }

    console.error('Update group error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update group'
    }, { status: 500 })
  }
}

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