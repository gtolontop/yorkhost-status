import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { host, port } = await request.json()
    
    if (!host || !port) {
      return NextResponse.json({
        success: false,
        error: 'Host and port are required'
      }, { status: 400 })
    }

    console.log(`Testing TCP connection to ${host}:${port}`)
    
    const startTime = Date.now()
    
    const result = await new Promise((resolve) => {
      const net = require('net')
      const socket = new net.Socket()
      
      const timer = setTimeout(() => {
        socket.destroy()
        console.log(`TCP check timeout for ${host}:${port}`)
        resolve({
          success: false,
          responseTime: Date.now() - startTime,
          error: 'Connection timeout (10s)'
        })
      }, 10000) // 10 second timeout
      
      socket.connect(port, host, () => {
        clearTimeout(timer)
        socket.destroy()
        console.log(`TCP check success for ${host}:${port} - ${Date.now() - startTime}ms`)
        resolve({
          success: true,
          responseTime: Date.now() - startTime,
          error: null
        })
      })
      
      socket.on('error', (error: any) => {
        clearTimeout(timer)
        socket.destroy()
        console.log(`TCP check error for ${host}:${port}:`, error.message)
        resolve({
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message
        })
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        host,
        port,
        checkResult: result
      }
    })
  } catch (error) {
    console.error('TCP debug check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}