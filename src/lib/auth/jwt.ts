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

export function requireAuth(allowedRoles?: string[]) {
  return async (request: Request) => {
    try {
      const authHeader = request.headers.get("authorization")
      const token = authHeader?.replace("Bearer ", "")

      if (!token) {
        return new Response(JSON.stringify({
          success: false,
          error: "Authentication required"
        }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      }

      const payload = await verifyToken(token)
      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid token"
        }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      }

      return { user: payload }
    } catch (error) {
      console.error("Auth middleware error:", error)
      return new Response(JSON.stringify({
        success: false,
        error: "Authentication error"
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }
}
