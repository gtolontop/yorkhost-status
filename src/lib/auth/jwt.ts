import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development"

export interface JWTPayload {
  userId: string
  username: string
  avatar?: string
  discordId: string
  iat?: number
  exp?: number
}

export function createToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d"
  })
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

export async function requireAuth(request: any): Promise<{ authorized: boolean; user?: JWTPayload; error?: string }> {
  try {
    const token = request.cookies?.get("auth-token")?.value

    if (!token) {
      return { authorized: false, error: "Authentication required" }
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return { authorized: false, error: "Invalid token" }
    }

    return { authorized: true, user: payload }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return { authorized: false, error: "Authentication error" }
  }
}

export function requirePermission(permission?: string) {
  return requireAuth
}

export function createUserSession(user: any) {
  const token = createToken({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    discordId: user.discordId
  })

  return { token, user }
}
