import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'
import { handleCheckResult } from '@/lib/incident-manager'

export async function GET() {
  try {
    console.log('⏰ CRON CHECK TRIGGERED...')
    
    // Get all active checks
    const checks = await prisma.check.findMany({
      where: { isActive: true },
      include: {
        service: true
      }
    })
    
    console.log(`Found ${checks.length} active checks`)
    
    if (checks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active checks found',
        results: []
      })
    }
    
    let successCount = 0
    let failedCount = 0
    const results: Array<{
      service: string
      type: string
      target: string
      success: boolean
      responseTime: number
      error?: string
    }> = []
    
    // Run all checks in parallel
    const checkPromises = checks.map(async (check) => {
      const startTime = Date.now()
      
      try {
        console.log(`🔍 Checking ${check.service.name} (${check.type}) -> ${check.target}`)
        
        // Use our corrected executeCheck function
        const result = await executeCheck(
          check.type,
          check.target,
          check.port,
          30000 // 30 seconds timeout
        )
        
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${check.service.name}: ${result.success ? 'UP' : 'DOWN'} (${result.responseTime}ms)`)
        
        // Save result to database
        const checkResultRecord = await prisma.checkResult.create({
          data: {
            checkId: check.id,
            success: result.success,
            responseTime: result.responseTime,
            statusCode: result.statusCode || null,
            error: result.error || null,
            responseBody: null,
            timestamp: new Date()
          }
        })
        
        // Handle incident creation/resolution
        await handleCheckResult({
          serviceId: check.serviceId,
          serviceName: check.service.name,
          checkId: check.id,
          success: result.success,
          timestamp: new Date(),
          error: result.error
        })
        
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
        
        results.push({
          service: check.service.name,
          type: check.type,
          target: check.target,
          success: result.success,
          responseTime: result.responseTime,
          error: result.error
        })
        
      } catch (error) {
        console.error(`❌ Error checking ${check.service.name}:`, error)
        
        // Save failed result
        await prisma.checkResult.create({
          data: {
            checkId: check.id,
            success: false,
            responseTime: Date.now() - startTime,
            statusCode: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            responseBody: null,
            timestamp: new Date()
          }
        })
        
        failedCount++
        
        results.push({
          service: check.service.name,
          type: check.type,
          target: check.target,
          success: false,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
    
    await Promise.all(checkPromises)
    
    console.log(`✅ Cron checks completed: ${successCount} successful, ${failedCount} failed`)
    
    return NextResponse.json({
      success: true,
      message: `Checks completed: ${successCount} successful, ${failedCount} failed`,
      timestamp: new Date().toISOString(),
      stats: {
        total: checks.length,
        successful: successCount,
        failed: failedCount
      },
      results
    })
    
  } catch (error) {
    console.error('❌ Cron check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}