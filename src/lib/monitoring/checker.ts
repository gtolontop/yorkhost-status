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
      
      case 'DNS':
        return await performDnsCheck(target, timeout)
      
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
    const url = target.startsWith('http') ? target : `https://${target}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
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
    
    socket.on('error', (error) => {
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
    // Simplified ping using HTTP HEAD request to the host
    // In a real implementation, you'd use ICMP
    const url = `http://${target}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
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
      error: error instanceof Error ? error.message : 'Ping failed'
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