import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const maintenances = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE'
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: maintenances
    })
  } catch (error) {
    console.error('Maintenance API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maintenances'
    }, { status: 500 })
  }
}