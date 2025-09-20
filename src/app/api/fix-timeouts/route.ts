import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔧 FIXING TIMEOUTS IN DATABASE...')
    
    // Update all checks to have proper timeouts (30 seconds instead of 10)
    const updatedChecks = await prisma.check.updateMany({
      data: {
        timeout: 30 // 30 seconds should be enough
      }
    })
    
    console.log(`✅ Updated ${updatedChecks.count} checks with 30s timeout`)
    
    // Get all checks to verify
    const checks = await prisma.check.findMany({
      include: {
        service: true
      }
    })
    
    const checkList = checks.map(check => ({
      service: check.service.name,
      type: check.type,
      target: check.target,
      oldTimeout: '10s',
      newTimeout: `${check.timeout}s`
    }))
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedChecks.count} checks with proper timeouts`,
      updatedChecks: updatedChecks.count,
      checks: checkList
    })
    
  } catch (error) {
    console.error('❌ Fix timeouts error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}