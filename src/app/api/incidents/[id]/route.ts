import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params

    if (!incidentId) {
      return NextResponse.json({
        success: false,
        error: 'Incident ID is required'
      }, { status: 400 })
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: true,
        machine: true,
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    if (!incident) {
      return NextResponse.json({
        success: false,
        error: 'Incident not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: incident
    })
  } catch (error) {
    console.error('Incident fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incident'
    }, { status: 500 })
  }
}