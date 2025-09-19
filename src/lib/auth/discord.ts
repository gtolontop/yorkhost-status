import axios from 'axios'
import { prisma } from '@/lib/db'

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string | null
}

export interface DiscordGuildMember {
  user: DiscordUser
  roles: string[]
  joined_at: string
}

export class DiscordAuth {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private guildId: string
  private requiredRoleId: string

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID!
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET!
    this.redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`
    this.guildId = process.env.DISCORD_GUILD_ID!
    this.requiredRoleId = process.env.DISCORD_ROLE_ID!

    if (!this.clientId || !this.clientSecret || !this.guildId || !this.requiredRoleId) {
      throw new Error('Missing required Discord environment variables')
    }
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify guilds guilds.members.read',
    })

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`
  }

  async exchangeCodeForToken(code: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> {
    try {
      const response = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Discord token exchange error:', error)
      throw new Error('Failed to exchange code for token')
    }
  }

  async getUser(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data
    } catch (error) {
      console.error('Discord user fetch error:', error)
      throw new Error('Failed to fetch user data')
    }
  }

  async getUserGuilds(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data
    } catch (error) {
      console.error('Discord guilds fetch error:', error)
      throw new Error('Failed to fetch user guilds')
    }
  }

  async getGuildMember(accessToken: string, userId: string): Promise<DiscordGuildMember | null> {
    try {
      // First, check if user is in the guild using bot token (if available)
      // For now, we'll use the user's access token with guilds.members.read scope
      const response = await axios.get(
        `https://discord.com/api/users/@me/guilds/${this.guildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Discord guild member fetch error:', error)
      return null
    }
  }

  async verifyUserRole(accessToken: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getGuildMember(accessToken, userId)
      
      if (!member) {
        console.log(`User ${userId} is not a member of guild ${this.guildId}`)
        return false
      }

      const hasRequiredRole = member.roles.includes(this.requiredRoleId)
      
      if (!hasRequiredRole) {
        console.log(`User ${userId} does not have required role ${this.requiredRoleId}`)
        return false
      }

      return true
    } catch (error) {
      console.error('Discord role verification error:', error)
      return false
    }
  }

  async authenticateUser(code: string): Promise<{
    user: DiscordUser
    hasAccess: boolean
    dbUser?: any
  }> {
    try {
      // Exchange code for token
      const tokenData = await this.exchangeCodeForToken(code)
      
      // Get user data
      const discordUser = await this.getUser(tokenData.access_token)
      
      // Verify user has required role
      const hasAccess = await this.verifyUserRole(tokenData.access_token, discordUser.id)
      
      if (!hasAccess) {
        return {
          user: discordUser,
          hasAccess: false
        }
      }

      // Find or create user in database
      let dbUser = await prisma.user.findUnique({
        where: { discordId: discordUser.id },
        include: { adminRole: true }
      })

      if (!dbUser) {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            discordId: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar,
            email: discordUser.email,
            lastLoginAt: new Date(),
          },
          include: { adminRole: true }
        })

        // Create admin role for new user
        await prisma.adminRole.create({
          data: {
            userId: dbUser.id,
            role: 'admin',
            permissions: {
              canManageServices: true,
              canManageIncidents: true,
              canManageUsers: true,
              canViewAuditLogs: true
            }
          }
        })
      } else {
        // Update last login
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            username: discordUser.username,
            avatar: discordUser.avatar,
            email: discordUser.email,
            lastLoginAt: new Date(),
          },
          include: { adminRole: true }
        })
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: dbUser.id,
          action: 'LOGIN',
          resource: 'AUTH',
          details: {
            method: 'discord',
            ip: 'unknown' // Will be filled in by the API route
          }
        }
      })

      return {
        user: discordUser,
        hasAccess: true,
        dbUser
      }
    } catch (error) {
      console.error('Discord authentication error:', error)
      throw error
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> {
    try {
      const response = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Discord token refresh error:', error)
      throw new Error('Failed to refresh token')
    }
  }
}

export const discordAuth = new DiscordAuth()