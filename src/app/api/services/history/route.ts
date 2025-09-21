import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBulkUptimeHistory } from '@/lib/db-optimized'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')
    
    // Get all services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true }
    })
    
    const serviceIds = services.map(s => s.id)
    
    // Use optimized bulk query
    const historyByService = await getBulkUptimeHistory(serviceIds, days)
    
    return NextResponse.json({
      success: true,
      data: historyByService
    })
  } catch (error) {
    console.error('Services history API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services history'
    }, { status: 500 })
  }
}