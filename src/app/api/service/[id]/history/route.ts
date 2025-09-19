import { NextRequest, NextResponse } from 'next/server'
import { getUptimeHistory } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Service ID is required'
      }, { status: 400 })
    }

    const history = await getUptimeHistory(serviceId, days)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Service history error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch service history'
    }, { status: 500 })
  }
}