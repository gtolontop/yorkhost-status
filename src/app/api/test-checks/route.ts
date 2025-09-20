import { NextResponse } from 'next/server'
import { executeCheck } from '@/lib/monitoring/checker'
import { CheckType } from '@prisma/client'

export async function GET() {
  try {
    console.log('🧪 Testing all check functions...')
    
    const tests = [
      {
        name: 'Google.com HTTP',
        type: 'HTTP' as CheckType,
        target: 'google.com'
      },
      {
        name: 'Google.com HTTPS',
        type: 'HTTPS' as CheckType,
        target: 'https://google.com'
      },
      {
        name: 'IP 83.150.218.42 ICMP',
        type: 'ICMP' as CheckType,
        target: '83.150.218.42'
      },
      {
        name: 'IP 83.150.218.42 TCP:80',
        type: 'TCP' as CheckType,
        target: '83.150.218.42',
        port: 80
      }
    ]
    
    const results = []
    
    for (const test of tests) {
      console.log(`Testing ${test.name}...`)
      const result = await executeCheck(test.type, test.target, test.port, 10000)
      results.push({
        test: test.name,
        ...result
      })
      console.log(`${test.name}: ${result.success ? '✅' : '❌'} ${result.responseTime}ms`)
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}