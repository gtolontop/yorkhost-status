import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv, json
    const type = searchParams.get('type') || 'uptime' // uptime, incidents, services
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const serviceId = searchParams.get('serviceId')

    // Date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    let data: any[] = []
    let filename = ''
    let headers: string[] = []

    switch (type) {
      case 'uptime':
        data = await exportUptimeData(start, end, serviceId)
        filename = `uptime-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}`
        headers = ['Date', 'Service', 'Total Checks', 'Successful', 'Failed', 'Uptime %']
        break

      case 'incidents':
        data = await exportIncidentsData(start, end)
        filename = `incidents-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}`
        headers = ['ID', 'Title', 'Type', 'Severity', 'Status', 'Start Time', 'End Time', 'Duration (min)', 'Affected Services']
        break

      case 'services':
        data = await exportServicesData()
        filename = `services-${new Date().toISOString().split('T')[0]}`
        headers = ['ID', 'Name', 'Type', 'URL/Target', 'Status', 'Uptime 7d', 'Uptime 30d', 'Last Check']
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid export type'
        }, { status: 400 })
    }

    if (format === 'csv') {
      const csv = generateCSV(headers, data)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid format'
    }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export data'
    }, { status: 500 })
  }
}

async function exportUptimeData(start: Date, end: Date, serviceId?: string | null) {
  const where = {
    timestamp: {
      gte: start,
      lte: end
    },
    ...(serviceId && {
      check: {
        serviceId
      }
    })
  }

  const results = await prisma.checkResult.findMany({
    where,
    include: {
      check: {
        include: {
          service: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  })

  // Group by date and service
  const grouped = results.reduce((acc: any, result) => {
    const date = result.timestamp.toISOString().split('T')[0]
    const serviceName = result.check.service?.name || 'Unknown'
    const key = `${date}_${serviceName}`

    if (!acc[key]) {
      acc[key] = {
        date,
        service: serviceName,
        total: 0,
        successful: 0,
        failed: 0
      }
    }

    acc[key].total++
    if (result.success) {
      acc[key].successful++
    } else {
      acc[key].failed++
    }

    return acc
  }, {})

  return Object.values(grouped).map((item: any) => ({
    date: item.date,
    service: item.service,
    total: item.total,
    successful: item.successful,
    failed: item.failed,
    uptime: item.total > 0 ? ((item.successful / item.total) * 100).toFixed(2) : '0.00'
  }))
}

async function exportIncidentsData(start: Date, end: Date) {
  const incidents = await prisma.incident.findMany({
    where: {
      startTime: {
        gte: start,
        lte: end
      }
    },
    include: {
      service: true,
      machine: true
    },
    orderBy: { startTime: 'desc' }
  })

  return incidents.map(incident => {
    const duration = incident.endTime
      ? Math.round((incident.endTime.getTime() - incident.startTime.getTime()) / 60000)
      : 'Ongoing'

    const affectedServices = incident.affectedServices.length > 0
      ? incident.affectedServices.join(', ')
      : incident.service?.name || incident.machine?.name || 'N/A'

    return {
      id: incident.id,
      title: incident.title,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      startTime: incident.startTime.toISOString(),
      endTime: incident.endTime?.toISOString() || 'N/A',
      duration,
      affectedServices
    }
  })
}

async function exportServicesData() {
  const services = await prisma.service.findMany({
    where: {
      isActive: true
    },
    include: {
      checks: {
        include: {
          results: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }
    }
  })

  return services.map(service => {
    const check = service.checks[0]
    const results7d = check?.results.filter(r =>
      r.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || []
    const results30d = check?.results || []

    const uptime7d = results7d.length > 0
      ? ((results7d.filter(r => r.success).length / results7d.length) * 100).toFixed(2)
      : 'N/A'

    const uptime30d = results30d.length > 0
      ? ((results30d.filter(r => r.success).length / results30d.length) * 100).toFixed(2)
      : 'N/A'

    const lastCheck = check?.results[0]
    const status = lastCheck?.success ? 'UP' : 'DOWN'

    return {
      id: service.id,
      name: service.name,
      type: check?.type || 'N/A',
      target: check?.target || service.url || 'N/A',
      status,
      uptime7d,
      uptime30d,
      lastCheck: lastCheck?.timestamp.toISOString() || 'Never'
    }
  })
}

function generateCSV(headers: string[], data: any[]): string {
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const rows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const key = header.toLowerCase().replace(/ /g, '_').replace(/%/g, '').replace(/\(.*\)/g, '').trim()
        return escapeCSV(row[key] || row[header] || '')
      }).join(',')
    )
  ]

  return rows.join('\n')
}

export const dynamic = 'force-dynamic'
