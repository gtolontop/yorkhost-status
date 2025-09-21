import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const incident = await prisma.incident.findUnique({
      where: { slug },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: true,
        machine: true
      }
    })

    if (!incident) {
      return NextResponse.json({
        success: false,
        error: 'Incident not found'
      }, { status: 404 })
    }

    // Calculate duration
    let duration = undefined
    if (incident.startTime) {
      const start = new Date(incident.startTime)
      const end = incident.endTime ? new Date(incident.endTime) : new Date()
      const diff = end.getTime() - start.getTime()
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      duration = hours > 0 
        ? `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`
        : `${minutes} min${minutes !== 1 ? 's' : ''}`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...incident,
        duration
      }
    })
  } catch (error) {
    console.error('Incident detail API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incident details'
    }, { status: 500 })
  }
}