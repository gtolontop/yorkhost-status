import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const machines = await prisma.machine.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          include: {
            checks: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: machines
    })
  } catch (error) {
    console.error('Machines fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch machines'
    }, { status: 500 })
  }
}