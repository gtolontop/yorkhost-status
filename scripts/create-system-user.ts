import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSystemUser() {
  try {
    // Check if system user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: 'system' }
    })

    if (existingUser) {
      console.log('✅ System user already exists:', existingUser.id)
      return existingUser
    }

    // Create system user
    const systemUser = await prisma.user.create({
      data: {
        id: 'system',
        discordId: 'system',
        username: 'system',
        email: 'system@yorkhost.fr',
        avatar: null
      }
    })

    console.log('✅ Created system user:', systemUser.id)
    return systemUser
  } catch (error) {
    console.error('❌ Failed to create system user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createSystemUser().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})