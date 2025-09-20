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
  console.log(`[CHECKER] Starting ${type} check for ${target}${port ? `:${port}` : ''}`)
  
  try {
    let result: CheckResult
    
    switch (type) {
      case 'HTTP':
      case 'HTTPS':
        result = await performHttpCheck(target, timeout)
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

// HTTP/HTTPS CHECK - SIMPLE ET FIABLE
async function performHttpCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Fix URL format
    let url = target
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${target}`
    }
    
    console.log(`[HTTP] Testing: ${url}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'GET', // Use GET instead of HEAD for better compatibility
      signal: controller.signal,
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    const success = response.status >= 200 && response.status < 400
    
    return {
      success,
      responseTime,
      statusCode: response.status,
      error: success ? undefined : `HTTP ${response.status} ${response.statusText}`
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    // If HTTPS fails, try HTTP as fallback
    if (target.includes('https://') || (!target.includes('http://') && !target.includes('https://'))) {
      try {
        const httpUrl = target.replace('https://', 'http://').replace(/^(?!http:\/\/)/, 'http://')
        console.log(`[HTTP] HTTPS failed, trying HTTP: ${httpUrl}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(httpUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Yorkhost-Status-Monitor/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          }
        })
        
        clearTimeout(timeoutId)
        const httpResponseTime = Date.now() - startTime
        const success = response.status >= 200 && response.status < 400
        
        return {
          success,
          responseTime: httpResponseTime,
          statusCode: response.status,
          error: success ? undefined : `HTTP ${response.status} ${response.statusText}`
        }
        
      } catch (httpError) {
        // Both HTTPS and HTTP failed
      }
    }
    
    return {
      success: false,
      responseTime,
      error: error.message || 'Connection failed'
    }
  }
}

// TCP CHECK - SIMPLE ET DIRECT
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
        error: `TCP connection timeout to ${target}:${port}`
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
        error: `TCP connection failed: ${error.message}`
      })
    })
  })
}

// PING CHECK - UTILISE HTTP/TCP COMME FALLBACK
async function performPingCheck(target: string, timeout: number): Promise<CheckResult> {
  console.log(`[PING] Testing ${target}`)
  
  // Try TCP on common ports first
  const ports = [80, 443, 22]
  
  for (const port of ports) {
    try {
      const result = await performTcpCheck(target, port, Math.min(timeout / 3, 3000))
      if (result.success) {
        console.log(`[PING] Success via TCP:${port}`)
        return result
      }
    } catch (e) {
      continue
    }
  }
  
  // Try HTTP fallback
  try {
    const httpResult = await performHttpCheck(target, timeout)
    if (httpResult.success) {
      console.log(`[PING] Success via HTTP`)
      return httpResult
    }
  } catch (e) {
    // Continue to final error
  }
  
  return {
    success: false,
    responseTime: timeout,
    error: `Host ${target} is not reachable via TCP or HTTP`
  }
}

// DNS CHECK - SIMPLE LOOKUP
async function performDnsCheck(target: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    const dns = require('dns').promises
    await Promise.race([
      dns.lookup(target),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), timeout))
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