import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayKey = today.toISOString().split('T')[0]
  
  // Get today's check results
  const todayResults = await prisma.checkResult.findMany({
    where: {
      timestamp: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      check: {
        include: {
          service: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  })
  
  // Get last 10 results regardless of date
  const lastResults = await prisma.checkResult.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: {
      check: {
        include: {
          service: true
        }
      }
    }
  })
  
  // Group today's results by service
  const todayByService: Record<string, any> = {}
  todayResults.forEach(result => {
    const serviceName = result.check.service.name
    if (!todayByService[serviceName]) {
      todayByService[serviceName] = {
        total: 0,
        successful: 0,
        failed: 0,
        timestamps: []
      }
    }
    todayByService[serviceName].total++
    if (result.success) {
      todayByService[serviceName].successful++
    } else {
      todayByService[serviceName].failed++
    }
    todayByService[serviceName].timestamps.push(result.timestamp)
  })
  
  return NextResponse.json({
    todayDate: todayKey,
    todayRange: {
      from: today.toISOString(),
      to: tomorrow.toISOString()
    },
    todayResultsCount: todayResults.length,
    todayByService,
    last10Results: lastResults.map(r => ({
      timestamp: r.timestamp.toISOString(),
      service: r.check.service.name,
      success: r.success,
      responseTime: r.responseTime
    }))
  })
}