import { PrismaClient, CheckType } from '@prisma/client'
import * as cron from 'node-cron'

const prisma = new PrismaClient()

interface CheckResult {
  checkId: string
  success: boolean
  responseTime?: number
  statusCode?: number
  error?: string
  responseBody?: string
  timestamp: Date
}

class MonitorWorker {
  private isRunning = false
  private checkIntervals = new Map<string, NodeJS.Timeout>()

  constructor() {
    console.log('🚀 Monitor Worker initialized')
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Monitor Worker is already running')
      return
    }

    try {
      this.isRunning = true
      console.log('▶️ Starting Monitor Worker...')

      // Load and schedule all active checks
      await this.loadAndScheduleChecks()

      // Reload checks every 5 minutes to pick up changes
      cron.schedule('*/5 * * * *', async () => {
        console.log('🔄 Reloading checks configuration...')
        await this.loadAndScheduleChecks()
      })

      console.log('✅ Monitor Worker started successfully')
    } catch (error) {
      console.error('❌ Failed to start Monitor Worker:', error)
      this.isRunning = false
      throw error
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Monitor Worker is not running')
      return
    }

    console.log('⏸️ Stopping Monitor Worker...')

    // Clear all check intervals
    this.checkIntervals.forEach(interval => clearInterval(interval))
    this.checkIntervals.clear()

    this.isRunning = false
    console.log('✅ Monitor Worker stopped')
  }

  private async loadAndScheduleChecks() {
    try {
      const checks = await prisma.check.findMany({
        where: { isActive: true },
        include: {
          service: true
        }
      })

      // Clear existing intervals
      this.checkIntervals.forEach(interval => clearInterval(interval))
      this.checkIntervals.clear()

      // Schedule each check
      for (const check of checks) {
        this.scheduleCheck(check)
      }

      console.log(`📋 Scheduled ${checks.length} active checks`)
    } catch (error) {
      console.error('❌ Failed to load checks:', error)
    }
  }

  private scheduleCheck(check: any) {
    // Execute immediately
    this.executeCheck(check).then(result => {
      this.saveCheckResult(result).catch(error => {
        console.error(`❌ Failed to save initial check result:`, error)
      })
    })

    // Then schedule regular intervals
    const intervalMs = check.interval * 1000

    const interval = setInterval(async () => {
      try {
        const result = await this.executeCheck(check)
        await this.saveCheckResult(result)
      } catch (error) {
        console.error(`❌ Error executing check ${check.id}:`, error)
      }
    }, intervalMs)

    this.checkIntervals.set(check.id, interval)

    console.log(`⏰ Scheduled check "${check.name}" (${check.type}) every ${check.interval}s`)
  }

  private async executeCheck(check: any): Promise<CheckResult> {
    const startTime = Date.now()
    const timestamp = new Date()

    console.log(`🔍 Executing check: ${check.name} (${check.type})`)

    try {
      // Use the shared checker from lib/monitoring/checker
      const { executeCheck } = require('../src/lib/monitoring/checker')
      const checkResult = await executeCheck(check.type, check.target, check.port, check.timeout)
      
      return {
        checkId: check.id,
        success: checkResult.success,
        responseTime: checkResult.responseTime,
        statusCode: checkResult.statusCode,
        error: checkResult.error,
        timestamp
      }
    } catch (error) {
      console.error(`Check execution error:`, error)
      return {
        checkId: check.id,
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      }
    }
  }

  private async saveCheckResult(result: CheckResult) {
    try {
      await prisma.checkResult.create({
        data: {
          checkId: result.checkId,
          success: result.success,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          error: result.error,
          responseBody: result.responseBody,
          timestamp: result.timestamp
        }
      })

      console.log(
        `💾 Saved result for check ${result.checkId}: ${
          result.success ? '✅ Success' : '❌ Failed'
        } (${result.responseTime}ms)`
      )

      // Cleanup old results (keep only last 1000 per check)
      await this.cleanupOldResults(result.checkId)
    } catch (error) {
      console.error('❌ Failed to save check result:', error)
    }
  }

  private async cleanupOldResults(checkId: string) {
    try {
      // Get the count of results
      const count = await prisma.checkResult.count({
        where: { checkId }
      })

      // If more than 1000 results, delete the oldest ones
      if (count > 1000) {
        const toDelete = count - 1000

        // Find the IDs of the oldest results to delete
        const oldResults = await prisma.checkResult.findMany({
          where: { checkId },
          orderBy: { timestamp: 'asc' },
          take: toDelete,
          select: { id: true }
        })

        // Delete them
        await prisma.checkResult.deleteMany({
          where: {
            id: { in: oldResults.map(r => r.id) }
          }
        })

        console.log(`🧹 Cleaned up ${toDelete} old results for check ${checkId}`)
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old results:', error)
    }
  }
}

// Start the worker
const worker = new MonitorWorker()

worker.start().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Received SIGINT, shutting down gracefully...')
  await worker.stop()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Received SIGTERM, shutting down gracefully...')
  await worker.stop()
  await prisma.$disconnect()
  process.exit(0)
})