import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUptimeHistory } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')
    
    // Get all services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true }
    })
    
    // Get history for all services in parallel
    const historyPromises = services.map(service => 
      getUptimeHistory(service.id, days)
        .then(history => ({ serviceId: service.id, history }))
        .catch(error => {
          console.error(`Error fetching history for service ${service.id}:`, error)
          return { serviceId: service.id, history: [] }
        })
    )
    
    const allHistory = await Promise.all(historyPromises)
    
    // Convert to object format for easy access
    const historyByService = allHistory.reduce((acc, { serviceId, history }) => {
      acc[serviceId] = history
      return acc
    }, {} as Record<string, any[]>)
    
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