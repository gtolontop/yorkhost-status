import { PrismaClient, CheckType } from '@prisma/client'
import * as cron from 'node-cron'
import axios from 'axios'
import * as net from 'net'
import * as dgram from 'dgram'
import { promisify } from 'util'

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

    this.isRunning = true
    console.log('▶️ Starting Monitor Worker...')

    // Load and schedule all active checks
    await this.loadAndScheduleChecks()

    // Schedule periodic check reload (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 Reloading checks configuration...')
      await this.loadAndScheduleChecks()
    })

    console.log('✅ Monitor Worker started successfully')
  }

  async stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    console.log('⏹️ Stopping Monitor Worker...')

    // Clear all scheduled checks
    this.checkIntervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.checkIntervals.clear()

    await prisma.$disconnect()
    console.log('✅ Monitor Worker stopped')
  }

  private async loadAndScheduleChecks() {
    try {
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

      // Clear existing intervals
      this.checkIntervals.forEach((interval) => {
        clearInterval(interval)
      })
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
    const intervalMs = check.interval * 1000 // Convert seconds to milliseconds

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
      let result: CheckResult

      switch (check.type) {
        case CheckType.HTTP:
        case CheckType.HTTPS:
          result = await this.executeHttpCheck(check, startTime, timestamp)
          break
        case CheckType.TCP:
          result = await this.executeTcpCheck(check, startTime, timestamp)
          break
        case CheckType.UDP:
          result = await this.executeUdpCheck(check, startTime, timestamp)
          break
        default:
          throw new Error(`Unsupported check type: ${check.type}`)
      }

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        checkId: check.id,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      }
    }
  }

  private async executeHttpCheck(check: any, startTime: number, timestamp: Date): Promise<CheckResult> {
    const protocol = check.type === CheckType.HTTPS ? 'https' : 'http'
    const url = check.target.startsWith('http') ? check.target : `${protocol}://${check.target}`

    try {
      const response = await axios.get(url, {
        timeout: check.timeout,
        headers: check.headers || {},
        validateStatus: () => true, // Don't throw on any status code
        maxRedirects: check.followRedirects ? 5 : 0
      })

      const responseTime = Date.now() - startTime
      const success = this.validateHttpResponse(response, check)

      return {
        checkId: check.id,
        success,
        responseTime,
        statusCode: response.status,
        responseBody: response.data ? String(response.data).substring(0, 1000) : undefined,
        error: success ? undefined : `Unexpected status code: ${response.status}`,
        timestamp
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (axios.isAxiosError(error)) {
        return {
          checkId: check.id,
          success: false,
          responseTime,
          statusCode: error.response?.status,
          error: error.message,
          timestamp
        }
      }

      throw error
    }
  }

  private validateHttpResponse(response: any, check: any): boolean {
    // Check status code
    if (check.expectedStatus !== null && check.expectedStatus !== undefined) {
      // If we have a specific expected status, check for it
      if (response.status !== check.expectedStatus) {
        // But if followRedirects is true and we got a redirect, that's still OK
        if (!(check.followRedirects && response.status >= 300 && response.status < 400)) {
          return false
        }
      }
    }

    // Check response body
    if (check.expectedBody) {
      const bodyString = String(response.data)
      if (!bodyString.includes(check.expectedBody)) {
        return false
      }
    }

    // Default success criteria
    return response.status >= 200 && response.status < 400
  }

  private async executeTcpCheck(check: any, startTime: number, timestamp: Date): Promise<CheckResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      let resolved = false

      const cleanup = () => {
        if (!resolved) {
          resolved = true
          socket.destroy()
        }
      }

      const timeout = setTimeout(() => {
        cleanup()
        resolve({
          checkId: check.id,
          success: false,
          responseTime: Date.now() - startTime,
          error: 'Connection timeout',
          timestamp
        })
      }, check.timeout)

      socket.connect(check.port, check.target, () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          socket.destroy()
          
          resolve({
            checkId: check.id,
            success: true,
            responseTime: Date.now() - startTime,
            timestamp
          })
        }
      })

      socket.on('error', (error) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          socket.destroy()
          
          resolve({
            checkId: check.id,
            success: false,
            responseTime: Date.now() - startTime,
            error: error.message,
            timestamp
          })
        }
      })
    })
  }

  private async executeUdpCheck(check: any, startTime: number, timestamp: Date): Promise<CheckResult> {
    return new Promise((resolve) => {
      const client = dgram.createSocket('udp4')
      let resolved = false

      const cleanup = () => {
        if (!resolved) {
          resolved = true
          client.close()
        }
      }

      const timeout = setTimeout(() => {
        cleanup()
        resolve({
          checkId: check.id,
          success: false,
          responseTime: Date.now() - startTime,
          error: 'UDP check timeout',
          timestamp
        })
      }, check.timeout)

      // Send a simple ping message
      const message = Buffer.from('ping')
      
      client.send(message, 0, message.length, check.port, check.target, (error) => {
        if (error) {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            client.close()
            
            resolve({
              checkId: check.id,
              success: false,
              responseTime: Date.now() - startTime,
              error: error.message,
              timestamp
            })
          }
          return
        }

        // For UDP, if no error occurred during send, consider it successful
        // (UDP is connectionless, so we can't guarantee delivery)
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          client.close()
          
          resolve({
            checkId: check.id,
            success: true,
            responseTime: Date.now() - startTime,
            timestamp
          })
        }
      })

      client.on('error', (error) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          client.close()
          
          resolve({
            checkId: check.id,
            success: false,
            responseTime: Date.now() - startTime,
            error: error.message,
            timestamp
          })
        }
      })
    })
  }

  private async saveCheckResult(result: CheckResult) {
    try {
      await prisma.checkResult.create({
        data: result
      })

      const status = result.success ? '✅' : '❌'
      const responseTime = result.responseTime ? `(${result.responseTime}ms)` : ''
      console.log(`${status} Check ${result.checkId}: ${result.success ? 'SUCCESS' : 'FAILED'} ${responseTime}`)

      // TODO: Trigger real-time updates
      // TODO: Check for incident conditions and create alerts

    } catch (error) {
      console.error('❌ Failed to save check result:', error)
    }
  }

  private async checkForIncidents() {
    // TODO: Implement incident detection logic
    // - Check for consecutive failures
    // - Check for response time degradation
    // - Auto-create incidents based on thresholds
  }
}

// Create and start the worker
const worker = new MonitorWorker()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...')
  await worker.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down...')
  await worker.stop()
  process.exit(0)
})

// Start the worker if this file is executed directly
if (require.main === module) {
  worker.start().catch((error) => {
    console.error('❌ Failed to start worker:', error)
    process.exit(1)
  })
}

export default worker