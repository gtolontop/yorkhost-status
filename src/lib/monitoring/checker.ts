import { CheckType } from '@prisma/client'

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
  timeout: number = 10000
): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    switch (type) {
      case 'HTTP':
      case 'HTTPS':
        return await performHttpCheck(target, timeout)
      
      case 'TCP':
        if (!port) throw new Error('Port is required for TCP checks')
        return await performTcpCheck(target, port, timeout)
      
      case 'ICMP':
        return await performPingCheck(target, timeout)
      
      case 'UDP':
        return await performDnsCheck(target, timeout) // UDP can be used for DNS checks
      
      default:
        throw new Error(`Unsupported check type: ${type}`)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function performHttpCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Ensure target has protocol
    const url = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    return {
      success: response.ok,
      responseTime,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function performTcpCheck(target: string, port: number, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const net = require('net')
    const socket = new net.Socket()
    
    const timer = setTimeout(() => {
      socket.destroy()
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        error: 'Connection timeout'
      })
    }, timeout)
    
    socket.connect(port, target, () => {
      clearTimeout(timer)
      socket.destroy()
      resolve({
        success: true,
        responseTime: Date.now() - startTime
      })
    })
    
    socket.on('error', (error: any) => {
      clearTimeout(timer)
      socket.destroy()
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      })
    })
  })
}

async function performPingCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Use TCP connection test instead of ICMP ping for better Vercel compatibility
    // Try common ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS)
    const ports = [80, 443, 22, 53]
    
    for (const port of ports) {
      try {
        const result = await performTcpCheck(target, port, timeout)
        if (result.success) {
          return {
            success: true,
            responseTime: result.responseTime,
            error: undefined
          }
        }
      } catch (e) {
        // Continue to next port
        continue
      }
    }
    
    // If no port is reachable, try HTTP as fallback
    try {
      const httpResult = await performHttpCheck(`http://${target}`, timeout)
      if (httpResult.success) {
        return httpResult
      }
    } catch (e) {
      // Continue to HTTPS fallback
    }
    
    // Final fallback: HTTPS
    try {
      const httpsResult = await performHttpCheck(`https://${target}`, timeout)
      return httpsResult
    } catch (e) {
      // All methods failed
      const responseTime = Date.now() - startTime
      return {
        success: false,
        responseTime,
        error: 'Host unreachable on all tested ports and protocols'
      }
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Ping check failed'
    }
  }
}

async function performDnsCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Use DNS resolution
    const dns = require('dns').promises
    await dns.lookup(target)
    
    const responseTime = Date.now() - startTime
    return {
      success: true,
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'DNS resolution failed'
    }
  }
}