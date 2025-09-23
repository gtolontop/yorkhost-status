import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const now = new Date()

    // Find scheduled maintenances that should start now
    const scheduledToStart = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE',
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now
        }
      }
    })

    // Find in-progress maintenances that should complete now
    const scheduledToComplete = await prisma.incident.findMany({
      where: {
        type: 'MAINTENANCE',
        status: 'IN_PROGRESS',
        scheduledEnd: {
          lte: now
        }
      }
    })

    const updates = []

    // Start scheduled maintenances
    for (const maintenance of scheduledToStart) {
      await prisma.incident.update({
        where: { id: maintenance.id },
        data: { status: 'IN_PROGRESS' }
      })

      // Add automatic update
      await prisma.incidentUpdate.create({
        data: {
          incidentId: maintenance.id,
          title: 'Maintenance Started',
          message: 'Maintenance has automatically started as scheduled.',
          status: 'IN_PROGRESS',
          authorName: 'System',
          isStatusChange: true
        }
      })

      updates.push({
        id: maintenance.id,
        title: maintenance.title,
        action: 'started'
      })
    }

    // Complete in-progress maintenances
    for (const maintenance of scheduledToComplete) {
      await prisma.incident.update({
        where: { id: maintenance.id },
        data: {
          status: 'COMPLETED',
          endTime: now
        }
      })

      // Add automatic update
      await prisma.incidentUpdate.create({
        data: {
          incidentId: maintenance.id,
          title: 'Maintenance Completed',
          message: 'Maintenance has been automatically completed as scheduled.',
          status: 'COMPLETED',
          authorName: 'System',
          isStatusChange: true
        }
      })

      updates.push({
        id: maintenance.id,
        title: maintenance.title,
        action: 'completed'
      })
    }

    // Also toggle checks for maintenance services
    try {
      const toggleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/maintenances/toggle-checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (toggleResponse.ok) {
        const toggleData = await toggleResponse.json()
        console.log('Maintenance checks toggled:', toggleData.details)
      }
    } catch (error) {
      console.error('Failed to toggle maintenance checks:', error)
    }

    return NextResponse.json({
      success: true,
      updates: updates,
      message: `Updated ${updates.length} maintenance(s)`
    })
  } catch (error) {
    console.error('Auto-status update error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update maintenance statuses'
    }, { status: 500 })
  }
}