import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params
    const { searchParams } = new URL(request.url)

    const style = searchParams.get('style') || 'flat' // flat, flat-square, for-the-badge
    const label = searchParams.get('label') || 'status'
    const uptime = searchParams.get('uptime') === 'true'

    // Fetch service with recent check results
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        checks: {
          include: {
            results: {
              take: 1,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    })

    if (!service) {
      return generateBadgeSVG(label, 'unknown', '#9ca3af', style)
    }

    const check = service.checks[0]
    const lastResult = check?.results[0]

    let message = 'unknown'
    let color = '#9ca3af'

    if (uptime) {
      // Calculate uptime badge
      const uptimePercentage = await calculateUptime(serviceId)
      message = `${uptimePercentage}% uptime`

      if (uptimePercentage >= 99.9) {
        color = '#10b981' // green
      } else if (uptimePercentage >= 95) {
        color = '#f59e0b' // orange
      } else {
        color = '#ef4444' // red
      }
    } else {
      // Status badge
      if (lastResult) {
        if (lastResult.success) {
          message = 'operational'
          color = '#10b981' // green
        } else {
          message = 'down'
          color = '#ef4444' // red
        }
      }
    }

    const svg = generateBadgeSVG(label, message, color, style)

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60', // Cache 1 minute
      },
    })

  } catch (error) {
    console.error('Badge generation error:', error)
    const svg = generateBadgeSVG('status', 'error', '#ef4444', 'flat')

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}

async function calculateUptime(serviceId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const results = await prisma.checkResult.findMany({
    where: {
      check: {
        serviceId
      },
      timestamp: {
        gte: sevenDaysAgo
      }
    },
    select: {
      success: true
    }
  })

  if (results.length === 0) return 100

  const successCount = results.filter(r => r.success).length
  return Math.round((successCount / results.length) * 10000) / 100
}

function generateBadgeSVG(label: string, message: string, color: string, style: string): string {
  const labelWidth = Math.max(label.length * 6 + 10, 50)
  const messageWidth = Math.max(message.length * 6 + 10, 50)
  const totalWidth = labelWidth + messageWidth
  const height = style === 'for-the-badge' ? 28 : 20

  const radius = style === 'flat-square' ? 0 : 3
  const fontSize = style === 'for-the-badge' ? 11 : 11
  const fontWeight = style === 'for-the-badge' ? 'bold' : 'normal'
  const textTransform = style === 'for-the-badge' ? 'uppercase' : 'none'

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${fontSize}" font-weight="${fontWeight}">
    <text aria-hidden="true" x="${labelWidth / 2}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(label.length * 60)}" style="text-transform: ${textTransform}">${label}</text>
    <text x="${labelWidth / 2}" y="${height / 2 + 3}" transform="scale(.1)" fill="#fff" textLength="${(label.length * 60)}" style="text-transform: ${textTransform}">${label}</text>
    <text aria-hidden="true" x="${labelWidth + messageWidth / 2}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(message.length * 60)}" style="text-transform: ${textTransform}">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="${height / 2 + 3}" transform="scale(.1)" fill="#fff" textLength="${(message.length * 60)}" style="text-transform: ${textTransform}">${message}</text>
  </g>
</svg>`.trim()
}

export const dynamic = 'force-dynamic'
