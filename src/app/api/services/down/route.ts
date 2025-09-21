import { NextResponse } from 'next/server'
import { getDownServices } from '@/lib/db'

export async function GET() {
  try {
    const downServices = await getDownServices()

    return NextResponse.json({
      success: true,
      data: downServices
    })
  } catch (error) {
    console.error('Down services API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch down services'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'