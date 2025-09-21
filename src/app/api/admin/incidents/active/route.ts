import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { getRecentIncidents } from '@/lib/incident-manager'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const incidents = await getRecentIncidents()
    
    return NextResponse.json({
      success: true,
      data: incidents
    })
  } catch (error) {
    console.error('Active incidents fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch incidents' 
    }, { status: 500 })
  }
}