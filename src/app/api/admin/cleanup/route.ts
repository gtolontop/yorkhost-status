import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🧹 Starting database cleanup...')
    
    // Delete ALL old check results to start fresh
    const deletedResults = await prisma.checkResult.deleteMany({})
    console.log(`✅ Deleted ${deletedResults.count} old check results`)
    
    // Make sure all checks are active
    const updatedChecks = await prisma.check.updateMany({
      data: {
        isActive: true
      }
    })
    console.log(`✅ Reactivated ${updatedChecks.count} checks`)
    
    // List all services for verification
    const services = await prisma.service.findMany({
      include: {
        checks: true,
        machine: true
      }
    })
    
    const servicesList = services.map(service => ({
      name: service.name,
      type: service.checks[0]?.type || 'NO_CHECK',
      target: service.checks[0]?.target || service.url || 'NO_TARGET',
      active: service.isActive && (service.checks[0]?.isActive || false)
    }))
    
    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully',
      stats: {
        deletedResults: deletedResults.count,
        updatedChecks: updatedChecks.count,
        totalServices: services.length
      },
      services: servicesList
    })
    
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}