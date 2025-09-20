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

    const users = await prisma.user.findMany({
      include: {
        adminRole: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar,
      discordId: user.discordId,
      roles: user.adminRole ? [user.adminRole.role] : ['user'],
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString() || null,
      isActive: true // We don't have an isActive field in the schema yet
    }))

    return NextResponse.json({
      success: true,
      data: transformedUsers
    })
  } catch (error) {
    console.error('Get users error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}