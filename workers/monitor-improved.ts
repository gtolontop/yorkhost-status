import { PrismaClient, CheckType } from '@prisma/client'

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

interface ScheduledCheck {
  interval: NodeJS.Timeout
  lastRun: Date
  nextRun: Date
}

class MonitorWorker {
  private isRunning = false
  private scheduledChecks = new Map<string, ScheduledCheck>()
  private reloadInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout

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

      // Initial load and schedule of checks
      await this.loadAndScheduleChecks()

      // Reload checks every 5 minutes to pick up configuration changes
      this.reloadInterval = setInterval(async () => {
        console.log('🔄 Reloading checks configuration...')
        await this.loadAndScheduleChecks()
      }, 5 * 60 * 1000)

      // Run cleanup every hour
      this.cleanupInterval = setInterval(async () => {
        console.log('🧹 Running periodic cleanup...')
        await this.performGlobalCleanup()
      }, 60 * 60 * 1000)

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

    // Clear all intervals
    this.scheduledChecks.forEach(scheduled => clearInterval(scheduled.interval))
    this.scheduledChecks.clear()

    // Clear reload and cleanup intervals
    if (this.reloadInterval) clearInterval(this.reloadInterval)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)

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

      // Track which checks are still active
      const activeCheckIds = new Set(checks.map(c => c.id))

      // Remove intervals for checks that are no longer active
      for (const [checkId, scheduled] of Array.from(this.scheduledChecks.entries())) {
        if (!activeCheckIds.has(checkId)) {
          clearInterval(scheduled.interval)
          this.scheduledChecks.delete(checkId)
          console.log(`🗑️ Removed inactive check: ${checkId}`)
        }
      }

      // Schedule new or updated checks
      for (const check of checks) {
        // Check if this check already exists and has the same interval
        const existing = this.scheduledChecks.get(check.id)

        if (!existing) {
          // New check - schedule it
          await this.scheduleCheck(check)
        } else {
          // Check if interval has changed
          const nextRunDiff = existing.nextRun.getTime() - Date.now()
          const expectedInterval = check.interval * 1000

          // If interval has changed significantly (more than 10% difference)
          if (Math.abs(nextRunDiff - expectedInterval) > expectedInterval * 0.1) {
            console.log(`🔄 Rescheduling check ${check.id} due to interval change`)
            clearInterval(existing.interval)
            await this.scheduleCheck(check)
          }
        }
      }

      console.log(`📋 Active checks: ${this.scheduledChecks.size}`)
    } catch (error) {
      console.error('❌ Failed to load checks:', error)
    }
  }

  private async scheduleCheck(check: any) {
    // Execute immediately
    const initialRun = this.executeCheck(check)
    initialRun.then(result => {
      this.saveCheckResult(result).catch(error => {
        console.error(`❌ Failed to save initial check result:`, error)
      })
    }).catch(error => {
      console.error(`❌ Failed to execute initial check:`, error)
    })

    // Schedule regular intervals
    const intervalMs = check.interval * 1000
    const now = new Date()

    const interval = setInterval(async () => {
      try {
        const result = await this.executeCheck(check)
        await this.saveCheckResult(result)

        // Update last run time
        const scheduled = this.scheduledChecks.get(check.id)
        if (scheduled) {
          scheduled.lastRun = new Date()
          scheduled.nextRun = new Date(Date.now() + intervalMs)
        }
      } catch (error) {
        console.error(`❌ Error executing check ${check.id}:`, error)
      }
    }, intervalMs)

    this.scheduledChecks.set(check.id, {
      interval,
      lastRun: now,
      nextRun: new Date(now.getTime() + intervalMs)
    })

    console.log(`⏰ Scheduled check "${check.name}" (${check.type}) every ${check.interval}s`)
  }

  private async executeCheck(check: any): Promise<CheckResult> {
    const startTime = Date.now()
    const timestamp = new Date()

    console.log(`🔍 Executing check: ${check.name} (${check.type})`)

    try {
      // Dynamic import to avoid circular dependencies
      const { executeCheck } = await import('../src/lib/monitoring/checker')
      const checkResult = await executeCheck(check.type, check.target, check.port, check.timeout, check.acceptedStatusCodes)

      const responseTime = Date.now() - startTime

      return {
        checkId: check.id,
        success: checkResult.success,
        responseTime: checkResult.responseTime || responseTime,
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
      // Get service info for this check
      const check = await prisma.check.findUnique({
        where: { id: result.checkId },
        include: { service: true }
      })

      if (!check) {
        console.error(`❌ Check ${result.checkId} not found`)
        return
      }

      // Save the new result
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

      // Handle auto-incident logic
      if (check.service) {
        const { autoIncidentManager } = await import('../src/lib/auto-incident-manager')
        await autoIncidentManager.handleCheckResult({
          checkId: result.checkId,
          serviceId: check.service.id,
          serviceName: check.service.name,
          success: result.success,
          timestamp: result.timestamp,
          error: result.error,
          responseTime: result.responseTime
        })
      }

      // Cleanup old results for this check
      await this.cleanupCheckResults(result.checkId)
    } catch (error) {
      console.error('❌ Failed to save check result:', error)
    }
  }

  private async cleanupCheckResults(checkId: string, maxResults = 1000) {
    try {
      // Count total results for this check
      const count = await prisma.checkResult.count({
        where: { checkId }
      })

      if (count > maxResults) {
        const toDelete = count - maxResults

        // Find oldest results to delete
        const oldResults = await prisma.checkResult.findMany({
          where: { checkId },
          orderBy: { timestamp: 'asc' },
          take: toDelete,
          select: { id: true }
        })

        // Delete in batches to avoid large transactions
        const batchSize = 100
        for (let i = 0; i < oldResults.length; i += batchSize) {
          const batch = oldResults.slice(i, i + batchSize)
          await prisma.checkResult.deleteMany({
            where: {
              id: { in: batch.map(r => r.id) }
            }
          })
        }

        console.log(`🧹 Cleaned up ${toDelete} old results for check ${checkId}`)
      }
    } catch (error) {
      console.error('❌ Failed to cleanup check results:', error)
    }
  }

  private async performGlobalCleanup() {
    try {
      // Delete very old results (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const deleted = await prisma.checkResult.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      })

      if (deleted.count > 0) {
        console.log(`🧹 Global cleanup: deleted ${deleted.count} results older than 30 days`)
      }

      // Clean up orphaned results (results for non-existent checks)
      const checks = await prisma.check.findMany({
        select: { id: true }
      })
      const validCheckIds = new Set(checks.map(c => c.id))

      const allResults = await prisma.checkResult.groupBy({
        by: ['checkId']
      })

      for (const result of allResults) {
        if (!validCheckIds.has(result.checkId)) {
          await prisma.checkResult.deleteMany({
            where: { checkId: result.checkId }
          })
          console.log(`🧹 Deleted orphaned results for check ${result.checkId}`)
        }
      }
    } catch (error) {
      console.error('❌ Global cleanup failed:', error)
    }
  }

  // Get worker status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeChecks: this.scheduledChecks.size,
      checks: Array.from(this.scheduledChecks.entries()).map(([id, scheduled]) => ({
        id,
        lastRun: scheduled.lastRun,
        nextRun: scheduled.nextRun
      }))
    }
  }
}

// Create and start the worker
const worker = new MonitorWorker()

// Start the worker
worker.start().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n⏹️ Received ${signal}, shutting down gracefully...`)
  await worker.stop()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// Log worker status periodically (every minute)
setInterval(() => {
  const status = worker.getStatus()
  console.log(`📊 Worker status: Running=${status.isRunning}, Active checks=${status.activeChecks}`)
}, 60 * 1000)

export default worker