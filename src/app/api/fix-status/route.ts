import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔧 FIXING STATUS CALCULATION...')
    
    // Get all services with their latest check results
    const services = await prisma.service.findMany({
      include: {
        checks: {
          include: {
            results: {
              orderBy: { timestamp: 'desc' },
              take: 10 // Get last 10 results
            }
          }
        }
      }
    })
    
    const fixedServices = []
    
    for (const service of services) {
      console.log(`\n📊 Analyzing ${service.name}...`)
      
      for (const check of service.checks) {
        const results = check.results
        console.log(`Found ${results.length} results for check ${check.id}`)
        
        if (results.length > 0) {
          // Show latest results
          const latest = results[0]
          console.log(`Latest result: ${latest.success ? 'SUCCESS' : 'FAILED'} at ${latest.timestamp}`)
          
          // Calculate success rate from recent results
          const successCount = results.filter(r => r.success).length
          const totalCount = results.length
          const successRate = (successCount / totalCount) * 100
          
          console.log(`Success rate: ${successCount}/${totalCount} = ${successRate.toFixed(1)}%`)
          
          fixedServices.push({
            service: service.name,
            checkId: check.id,
            latestResult: latest.success,
            latestTime: latest.timestamp,
            successRate: successRate,
            totalResults: totalCount
          })
        } else {
          console.log('No results found!')
          fixedServices.push({
            service: service.name,
            checkId: check.id,
            latestResult: null,
            latestTime: null,
            successRate: 0,
            totalResults: 0
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Status analysis completed',
      timestamp: new Date().toISOString(),
      services: fixedServices
    })
    
  } catch (error) {
    console.error('❌ Fix status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}