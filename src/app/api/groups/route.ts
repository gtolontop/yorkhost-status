import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Public API - no auth required for reading groups
    
    // Use machines table as groups
    const machines = await prisma.machine.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        services: {
          where: { isActive: true }
        }
      }
    })

    // Transform machines to groups format
    const groups = machines.map(machine => {
      // Extract color from tags
      const colorTag = machine.tags.find(tag => tag.startsWith('color:'))
      const color = colorTag ? colorTag.replace('color:', '') : '#6b7280'
      
      return {
        id: machine.id,
        name: machine.name,
        description: machine.description || '',
        color,
        order: machine.order,
        servicesCount: machine.services.length
      }
    })

    return NextResponse.json({
      success: true,
      data: groups
    })
  } catch (error) {
    console.error('Groups fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 })
  }
}