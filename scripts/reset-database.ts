import { PrismaClient } from '@prisma/client'

// Destructive: point DATABASE_URL at the database you actually want reset.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — refusing to reset an unknown database.')
}

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🗑️  Resetting database...')
  
  try {
    // Delete in correct order to respect foreign key constraints
    console.log('Deleting audit logs...')
    await prisma.auditLog.deleteMany()
    
    console.log('Deleting notifications...')
    await prisma.notification.deleteMany()
    
    console.log('Deleting incident updates...')
    await prisma.incidentUpdate.deleteMany()
    
    console.log('Deleting incidents...')
    await prisma.incident.deleteMany()
    
    console.log('Deleting check results...')
    await prisma.checkResult.deleteMany()
    
    console.log('Deleting uptime stats...')
    await prisma.uptimeStats.deleteMany()
    
    console.log('Deleting checks...')
    await prisma.check.deleteMany()
    
    console.log('Deleting services...')
    await prisma.service.deleteMany()
    
    console.log('Deleting machines...')
    await prisma.machine.deleteMany()
    
    console.log('Deleting admin roles...')
    await prisma.adminRole.deleteMany()
    
    console.log('Deleting users...')
    await prisma.user.deleteMany()
    
    console.log('✅ Database reset complete!')
    
  } catch (error) {
    console.error('❌ Error resetting database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()