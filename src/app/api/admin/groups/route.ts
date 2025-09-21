import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock groups until DB is migrated
    const mockGroups = [
      { id: 'web', name: 'Web Servers', description: 'Web servers and frontend services', color: '#3b82f6', order: 0 },
      { id: 'api', name: 'API Services', description: 'Backend APIs and business services', color: '#10b981', order: 1 },
      { id: 'database', name: 'Databases', description: 'Database services and data storage', color: '#f59e0b', order: 2 },
      { id: 'monitoring', name: 'Monitoring', description: 'Monitoring and metrics services', color: '#ef4444', order: 3 },
      { id: 'ungrouped', name: 'Ungrouped', description: 'Services not assigned to any group', color: '#94a3b8', order: 999 }
    ]

    return NextResponse.json({
      success: true,
      data: mockGroups
    })
  } catch (error) {
    console.error('Groups fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createGroupSchema.parse(body)

    // For now, just return a mock response
    const newGroup = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      color: data.color || '#6b7280',
      icon: data.icon || null,
      order: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newGroup
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Create group error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create group' }, { status: 500 })
  }
}