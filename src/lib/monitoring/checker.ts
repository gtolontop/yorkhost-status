import { CheckType } from '@prisma/client'
import axios from 'axios'
import https from 'https'
import * as net from 'net'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CheckResult {
  success: boolean
  responseTime: number
  error?: string
  statusCode?: number
}

export async function executeCheck(
  type: CheckType,
  target: string,
  port?: number | null,
  timeout: number = 10000,
  acceptedStatusCodes?: number[]
): Promise<CheckResult> {
  console.log(`[CHECKER] Starting ${type} check for ${target}${port ? `:${port}` : ''}`)
  
  try {
    let result: CheckResult
    
    switch (type) {
      case 'HTTP':
      case 'HTTPS':
        result = await performHttpCheck(target, timeout, acceptedStatusCodes)
        break
      
      case 'TCP':
        if (!port) throw new Error('Port is required for TCP checks')
        result = await performTcpCheck(target, port, timeout)
        break
      
      case 'ICMP':
        result = await performPingCheck(target, timeout)
        break
      
      case 'UDP':
        result = await performDnsCheck(target, timeout)
        break
      
      default:
        throw new Error(`Unsupported check type: ${type}`)
    }
    
    console.log(`[CHECKER] ${type} check result:`, result)
    return result
    
  } catch (error) {
    console.error(`[CHECKER] ${type} check error:`, error)
    return {
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// HTTP/HTTPS CHECK - USING AXIOS FOR BETTER COMPATIBILITY
async function performHttpCheck(target: string, timeout: number, acceptedStatusCodes?: number[]): Promise<CheckResult> {
  const startTime = Date.now()

  // Default accepted status codes if not provided
  const validStatusCodes = acceptedStatusCodes && acceptedStatusCodes.length > 0
    ? acceptedStatusCodes
    : [200, 201, 202, 203, 204, 301, 302, 303, 304, 307, 308]

  try {
    // Fix URL format
    let url = target
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${target}`
    }

    console.log(`[HTTP] Testing: ${url}`)
    console.log(`[HTTP] Accepted status codes: ${validStatusCodes.join(', ')}`)

    const response = await axios({
      method: 'GET',
      url: url,
      timeout: timeout,
      maxRedirects: 5,
      validateStatus: () => true, // Accept any status code
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      // Allow self-signed certificates and ignore SSL errors
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        timeout: timeout
      })
    })

    const responseTime = Date.now() - startTime
    const success = validStatusCodes.includes(response.status)

    console.log(`[HTTP] Response: ${response.status} in ${responseTime}ms - ${success ? 'SUCCESS' : 'FAILED'}`)

    return {
      success,
      responseTime,
      statusCode: response.status,
      error: success ? undefined : `HTTP ${response.status} (not in accepted codes: ${validStatusCodes.join(', ')})`
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.error(`[HTTP] Error:`, error.message)
    
    // If it's a timeout error, say so clearly
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        success: false,
        responseTime,
        error: 'Connection timeout'
      }
    }
    
    return {
      success: false,
      responseTime,
      error: error.message || 'Connection failed'
    }
  }
}

// TCP CHECK - SIMPLE SOCKET CONNECTION
async function performTcpCheck(target: string, port: number, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false
    
    // Remove protocol if present
    const cleanTarget = target.replace(/^https?:\/\//, '')
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true
        socket.destroy()
      }
    }
    
    const timeoutId = setTimeout(() => {
      cleanup()
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        error: 'Connection timeout'
      })
    }, timeout)
    
    socket.on('connect', () => {
      clearTimeout(timeoutId)
      cleanup()
      resolve({
        success: true,
        responseTime: Date.now() - startTime
      })
    })
    
    socket.on('error', (error) => {
      clearTimeout(timeoutId)
      cleanup()
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        error: `TCP connection failed: ${error.message}`
      })
    })
    
    socket.connect(port, cleanTarget)
  })
}

// PING CHECK - REAL ICMP PING
async function performPingCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  // Remove protocol if present
  const cleanTarget = target.replace(/^https?:\/\//, '')
  
  console.log(`[PING] Testing ${cleanTarget}`)
  
  try {
    // Use platform-specific ping command
    const isWindows = process.platform === 'win32'
    const pingCommand = isWindows 
      ? `ping -n 1 -w ${timeout} ${cleanTarget}`
      : `ping -c 1 -W ${Math.floor(timeout/1000)} ${cleanTarget}`
    
    const { stdout, stderr } = await execAsync(pingCommand)
    
    if (stderr && !stdout) {
      throw new Error(stderr)
    }
    
    // Check if ping was successful
    const isSuccess = isWindows
      ? (stdout.includes('TTL=') || stdout.includes('time='))
      : (stdout.includes('1 received') || stdout.includes('1 packets received'))
    
    const responseTime = Date.now() - startTime
    
    if (isSuccess) {
      // Try to extract actual ping time
      const timeMatch = stdout.match(/time[<=](\d+)(?:\.\d+)?(?:ms)?/i)
      const actualTime = timeMatch ? parseInt(timeMatch[1]) : responseTime
      
      console.log(`[PING] Success: ${actualTime}ms`)
      return {
        success: true,
        responseTime: actualTime
      }
    } else {
      // If ICMP fails, try TCP on port 80 as fallback
      console.log(`[PING] ICMP failed, trying TCP:80 fallback`)
      try {
        const tcpResult = await performTcpCheck(cleanTarget, 80, 10000)
        if (tcpResult.success) {
          console.log(`[PING] TCP:80 fallback success`)
          return tcpResult
        }
      } catch (e) {
        // Continue to error
      }
      
      return {
        success: false,
        responseTime: responseTime,
        error: 'Host unreachable'
      }
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.log(`[PING] Command error: ${error.message}`)
    
    // Fallback to TCP check on port 80 if ping command fails
    try {
      console.log(`[PING] Trying TCP:80 fallback after command error`)
      const tcpResult = await performTcpCheck(cleanTarget, 80, 10000)
      if (tcpResult.success) {
        console.log(`[PING] TCP:80 fallback success`)
        return tcpResult
      }
    } catch (e) {
      // Continue to error
    }
    
    return {
      success: false,
      responseTime: responseTime,
      error: `Ping failed: ${error.message}`
    }
  }
}

// DNS CHECK - SIMPLE DNS LOOKUP
async function performDnsCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    const dns = require('dns').promises
    
    // Remove protocol if present
    const cleanTarget = target.replace(/^https?:\/\//, '')
    
    await Promise.race([
      dns.lookup(cleanTarget),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DNS timeout')), timeout)
      )
    ])
    
    return {
      success: true,
      responseTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: `DNS lookup failed: ${error.message}`
    }
  }
}