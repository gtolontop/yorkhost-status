import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all resolved incidents and completed maintenances
    const incidents = await prisma.incident.findMany({
      where: {
        OR: [
          { status: 'RESOLVED' },
          { status: 'COMPLETED' }
        ]
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
      data: incidents
    })
  } catch (error) {
    console.error('Incidents history API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incident history'
    }, { status: 500 })
  }
}