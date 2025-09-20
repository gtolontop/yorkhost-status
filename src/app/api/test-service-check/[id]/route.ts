import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params
    
    console.log(`🧪 Testing service check for ID: ${serviceId}`)

    // Get service with its checks
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        checks: true
      }
    })

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    console.log(`Found service: ${service.name}`)

    // Get the first check
    let check = service.checks[0]
    if (!check && service.url) {
      // Create a basic HTTP check if none exists
      check = {
        id: 'temp',
        type: 'HTTP' as any,
        target: service.url,
        port: null,
        timeout: 10000
      } as any
    }

    if (!check) {
      return NextResponse.json({
        success: false,
        error: 'No check configuration found for this service'
      }, { status: 400 })
    }

    console.log(`Using check: ${check.type} -> ${check.target}`)

    // Perform the actual check using the NEW monitoring logic
    let checkResult
    try {
      checkResult = await executeCheck(
        check.type,
        check.target,
        check.port,
        check.timeout || 10000
      )
      
      console.log(`Check result:`, checkResult)
    } catch (err) {
      console.error(`Check error:`, err)
      checkResult = {
        success: false,
        responseTime: 0,
        error: err instanceof Error ? err.message : 'Check failed'
      }
    }

    // Save check result to database
    if (check.id !== 'temp') {
      await prisma.checkResult.create({
        data: {
          checkId: check.id,
          success: checkResult.success,
          responseTime: checkResult.responseTime,
          statusCode: checkResult.statusCode || null,
          error: checkResult.error,
          timestamp: new Date()
        }
      })
      console.log(`✅ Saved result to database`)
    }

    return NextResponse.json({
      success: true,
      message: 'Test completed successfully',
      data: {
        service: service.name,
        checkType: check.type,
        target: check.target,
        result: checkResult
      }
    })
  } catch (error) {
    console.error('Test service check error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}