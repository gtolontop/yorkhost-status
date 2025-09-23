import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Get all active maintenances (IN_PROGRESS)
    const activeMaintenances = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE',
        status: 'IN_PROGRESS'
      },
      select: {
        id: true,
        title: true,
        affectedServices: true
      }
    })

    // Get all scheduled maintenances that should start soon (within next 5 minutes)
    const soonToStartMaintenances = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE',
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(Date.now() + 5 * 60 * 1000) // Next 5 minutes
        }
      },
      select: {
        id: true,
        title: true,
        affectedServices: true
      }
    })

    // Combine both types of maintenances
    const allRelevantMaintenances = [...activeMaintenances, ...soonToStartMaintenances]

    // Get all unique service IDs that should have checks disabled
    const serviceIdsToDisable = new Set<string>()
    allRelevantMaintenances.forEach(maintenance => {
      maintenance.affectedServices.forEach(serviceId => {
        serviceIdsToDisable.add(serviceId)
      })
    })

    // Get all checks for affected services
    const affectedChecks = await prisma.check.findMany({
      where: {
        serviceId: { in: Array.from(serviceIdsToDisable) }
      },
      select: {
        id: true,
        serviceId: true,
        isActive: true,
        service: {
          select: {
            name: true
          }
        }
      }
    })

    // Get all checks for services NOT in maintenance
    const unaffectedChecks = await prisma.check.findMany({
      where: {
        serviceId: { notIn: Array.from(serviceIdsToDisable) }
      },
      select: {
        id: true,
        serviceId: true,
        isActive: true,
        service: {
          select: {
            name: true
          }
        }
      }
    })

    let disabledCount = 0
    let enabledCount = 0

    // Disable checks for services in maintenance
    if (affectedChecks.length > 0) {
      const activeAffectedChecks = affectedChecks.filter(check => check.isActive)
      if (activeAffectedChecks.length > 0) {
        await prisma.check.updateMany({
          where: {
            id: { in: activeAffectedChecks.map(c => c.id) }
          },
          data: {
            isActive: false
          }
        })
        disabledCount = activeAffectedChecks.length
      }
    }

    // Re-enable checks for services NOT in maintenance
    if (unaffectedChecks.length > 0) {
      const inactiveUnaffectedChecks = unaffectedChecks.filter(check => !check.isActive)
      if (inactiveUnaffectedChecks.length > 0) {
        await prisma.check.updateMany({
          where: {
            id: { in: inactiveUnaffectedChecks.map(c => c.id) }
          },
          data: {
            isActive: true
          }
        })
        enabledCount = inactiveUnaffectedChecks.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `Maintenance checks management completed`,
      details: {
        maintenancesActive: activeMaintenances.length,
        maintenancesSoon: soonToStartMaintenances.length,
        servicesInMaintenance: serviceIdsToDisable.size,
        checksDisabled: disabledCount,
        checksEnabled: enabledCount
      }
    })
  } catch (error) {
    console.error('Toggle maintenance checks error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to manage maintenance checks'
    }, { status: 500 })
  }
}