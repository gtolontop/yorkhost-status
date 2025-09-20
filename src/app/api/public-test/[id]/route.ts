import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCheck } from '@/lib/monitoring/checker'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params
    
    console.log(`🧪 PUBLIC TEST for service: ${serviceId}`)

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

    console.log(`Testing service: ${service.name}`)

    // Get the first check
    const check = service.checks[0]
    if (!check) {
      return NextResponse.json({
        success: false,
        error: 'No check configuration found'
      }, { status: 400 })
    }

    console.log(`Check: ${check.type} -> ${check.target}`)

    // Perform the check with LONG timeout
    const checkResult = await executeCheck(
      check.type,
      check.target,
      check.port,
      30000 // Force 30 seconds timeout
    )
    
    console.log(`Result:`, checkResult)

    // Save to database
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

    return NextResponse.json({
      success: true,
      data: checkResult
    })
    
  } catch (error) {
    console.error('Public test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}