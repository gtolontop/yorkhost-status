import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'

let workerInterval: NodeJS.Timeout | null = null
let isWorkerRunning = false

export async function GET() {
  return NextResponse.json({
    success: true,
    isRunning: isWorkerRunning
  })
}

export async function POST() {
  try {
    if (isWorkerRunning) {
      return NextResponse.json({
        success: false,
        message: 'Worker is already running'
      })
    }

    console.log('🚀 STARTING AUTOMATIC CHECKS WORKER...')
    
    // Start worker that runs every 30 seconds to check which services need checking
    workerInterval = setInterval(async () => {
      try {
        await runScheduledChecks()
      } catch (error) {
        console.error('❌ Worker error:', error)
      }
    }, 30000) // 30 seconds
    
    isWorkerRunning = true
    
    // Run initial check immediately
    await runScheduledChecks()
    
    return NextResponse.json({
      success: true,
      message: 'Worker started successfully - checks will run based on individual intervals',
      interval: '30 seconds check interval'
    })
    
  } catch (error) {
    console.error('❌ Start worker error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    if (workerInterval) {
      clearInterval(workerInterval)
      workerInterval = null
    }
    
    isWorkerRunning = false
    
    return NextResponse.json({
      success: true,
      message: 'Worker stopped'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function runScheduledChecks() {
  console.log('⏰ Checking for scheduled checks...')
  
  try {
    // Get all active checks with their last result
    const checks = await prisma.check.findMany({
      where: { isActive: true },
      include: {
        service: true,
        results: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    })
    
    console.log(`Found ${checks.length} active checks`)
    
    const now = new Date()
    const checksToRun = checks.filter(check => {
      // If no previous check, run it
      if (check.results.length === 0) return true
      
      // Check if enough time has passed since last check
      const lastCheck = check.results[0].timestamp
      const timeSinceLastCheck = (now.getTime() - lastCheck.getTime()) / 1000 // in seconds
      
      // Run if interval has passed
      return timeSinceLastCheck >= check.interval
    })
    
    if (checksToRun.length === 0) {
      console.log('No checks need to run at this time')
      return
    }
    
    console.log(`Running ${checksToRun.length} scheduled checks`)
    
    let successCount = 0
    let failedCount = 0
    
    // Run scheduled checks in parallel for speed
    const checkPromises = checksToRun.map(async (check) => {
      try {
        console.log(`🔍 Checking ${check.service.name} (${check.type}) -> ${check.target}`)
        
        // Use our corrected executeCheck function
        const result = await executeCheck(
          check.type,
          check.target,
          check.port,
          30000 // 30 seconds timeout
        )
        
        console.log(`${result.success ? '✅' : '❌'} ${check.service.name}: ${result.success ? 'UP' : 'DOWN'} (${result.responseTime}ms)`)
        
        // Save result to database
        await prisma.checkResult.create({
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
        
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
        
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
        
        failedCount++
      }
    })
    
    await Promise.all(checkPromises)
    
    console.log(`✅ Automatic checks completed: ${successCount} successful, ${failedCount} failed`)
    
  } catch (error) {
    console.error('❌ Failed to run automatic checks:', error)
  }
}