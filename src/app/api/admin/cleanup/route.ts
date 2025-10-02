import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🧹 Database cleanup - DÉSACTIVÉ')
    console.log('❌ La suppression automatique des données est désactivée')
    console.log('ℹ️  Les données sont conservées indéfiniment')

    // DÉSACTIVÉ: Conservation permanente de toutes les données
    // Les données ne sont JAMAIS supprimées automatiquement
    const deletedResults = { count: 0 }
    
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
      message: 'Cleanup désactivé - Les données sont conservées indéfiniment',
      stats: {
        deletedResults: 0,
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