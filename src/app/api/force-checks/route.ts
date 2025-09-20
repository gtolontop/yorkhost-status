import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'

export async function POST() {
  try {
    console.log('🚀 FORCING ALL CHECKS WITH NEW CODE...')
    
    // Get all active checks
    const checks = await prisma.check.findMany({
      where: { isActive: true },
      include: {
        service: {
          include: {
            machine: true
          }
        }
      }
    })
    
    console.log(`Found ${checks.length} active checks`)
    
    const results = []
    
    for (const check of checks) {
      console.log(`\n🔍 Testing ${check.service.name} (${check.type}) -> ${check.target}`)
      
      try {
        // Execute the check with new code
        const result = await executeCheck(
          check.type,
          check.target,
          check.port,
          check.timeout * 1000
        )
        
        console.log(`✅ Result: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.responseTime}ms)`)
        
        // Save result to database
        const savedResult = await prisma.checkResult.create({
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
        
        console.log(`💾 Saved to database with ID: ${savedResult.id}`)
        
        results.push({
          service: check.service.name,
          type: check.type,
          target: check.target,
          success: result.success,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          error: result.error,
          savedToDb: true
        })
        
      } catch (error) {
        console.error(`❌ Error checking ${check.service.name}:`, error)
        
        // Save failed result
        await prisma.checkResult.create({
          data: {
            checkId: check.id,
            success: false,
            responseTime: 0,
            statusCode: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            responseBody: null,
            timestamp: new Date()
          }
        })
        
        results.push({
          service: check.service.name,
          type: check.type,
          target: check.target,
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          savedToDb: true
        })
      }
    }
    
    // Count successes
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    console.log(`\n🎯 FINAL RESULTS: ${successCount}/${totalCount} checks successful`)
    
    return NextResponse.json({
      success: true,
      message: `Forced ${totalCount} checks, ${successCount} successful`,
      timestamp: new Date().toISOString(),
      stats: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      results
    })
    
  } catch (error) {
    console.error('❌ Force checks error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}