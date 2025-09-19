import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: string
  discordId: string
  username: string
  role: string
  permissions: Record<string, boolean>
  iat?: number
  exp?: number
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'yorkhost-status',
    audience: 'yorkhost-status-admin'
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

export async function validateUserSession(token: string): Promise<{
  valid: boolean
  user?: any
  payload?: JWTPayload
}> {
  const payload = verifyToken(token)
  
  if (!payload) {
    return { valid: false }
  }

  try {
    // Check if user still exists and has admin role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { adminRole: true }
    })

    if (!user || !user.adminRole) {
      return { valid: false }
    }

    return {
      valid: true,
      user,
      payload
    }
  } catch (error) {
    console.error('User session validation error:', error)
    return { valid: false }
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7)
}

export async function createUserSession(user: any): Promise<string> {
  const adminRole = user.adminRole || await prisma.adminRole.findUnique({
    where: { userId: user.id }
  })

  if (!adminRole) {
    throw new Error('User does not have admin role')
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    discordId: user.discordId,
    username: user.username,
    role: adminRole.role,
    permissions: adminRole.permissions as Record<string, boolean>
  }

  return generateToken(payload)
}

// Middleware helper for API routes
export async function requireAuth(req: any): Promise<{
  authorized: boolean
  user?: any
  payload?: JWTPayload
  error?: string
}> {
  const authHeader = req.headers.authorization
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return {
      authorized: false,
      error: 'No authorization token provided'
    }
  }

  const session = await validateUserSession(token)

  if (!session.valid) {
    return {
      authorized: false,
      error: 'Invalid or expired token'
    }
  }

  return {
    authorized: true,
    user: session.user,
    payload: session.payload
  }
}

// Permission checking helper
export function hasPermission(
  payload: JWTPayload,
  permission: string
): boolean {
  return payload.permissions[permission] === true
}

export function requirePermission(
  payload: JWTPayload,
  permission: string
): boolean {
  if (!hasPermission(payload, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
  return true
}