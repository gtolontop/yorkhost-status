import { PrismaClient, CheckType, IncidentStatus, IncidentSeverity } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create machines
  const webServer = await prisma.machine.create({
    data: {
      name: 'Web Server 1',
      description: 'Primary web server hosting main applications',
      category: 'web',
      location: 'US-East-1',
      tags: ['production', 'web', 'critical'],
    },
  })

  const dbServer = await prisma.machine.create({
    data: {
      name: 'Database Server',
      description: 'Primary PostgreSQL database server',
      category: 'database',
      location: 'US-East-1',
      tags: ['production', 'database', 'critical'],
    },
  })

  const apiServer = await prisma.machine.create({
    data: {
      name: 'API Server',
      description: 'REST API backend services',
      category: 'api',
      location: 'US-West-2',
      tags: ['production', 'api'],
    },
  })

  const cdnServer = await prisma.machine.create({
    data: {
      name: 'CDN Edge',
      description: 'Content delivery network edge servers',
      category: 'cdn',
      location: 'Global',
      tags: ['cdn', 'static'],
    },
  })

  const gameServer = await prisma.machine.create({
    data: {
      name: 'Game Server EU',
      description: 'European game server cluster',
      category: 'gaming',
      location: 'EU-West-1',
      tags: ['gaming', 'minecraft', 'production'],
    },
  })

  // Create services
  const mainWebsite = await prisma.service.create({
    data: {
      machineId: webServer.id,
      name: 'Main Website',
      description: 'Yorkhost main website',
      url: 'https://yorkhost.com',
      icon: '🌐',
    },
  })

  const clientPortal = await prisma.service.create({
    data: {
      machineId: webServer.id,
      name: 'Client Portal',
      description: 'Customer management portal',
      url: 'https://portal.yorkhost.com',
      icon: '👤',
    },
  })

  const database = await prisma.service.create({
    data: {
      machineId: dbServer.id,
      name: 'PostgreSQL Database',
      description: 'Primary database service',
      icon: '🗄️',
    },
  })

  const restAPI = await prisma.service.create({
    data: {
      machineId: apiServer.id,
      name: 'REST API',
      description: 'Main REST API endpoint',
      url: 'https://api.yorkhost.com',
      icon: '🔌',
    },
  })

  const cdn = await prisma.service.create({
    data: {
      machineId: cdnServer.id,
      name: 'Static Assets CDN',
      description: 'Content delivery network',
      url: 'https://cdn.yorkhost.com',
      icon: '⚡',
    },
  })

  const minecraft = await prisma.service.create({
    data: {
      machineId: gameServer.id,
      name: 'Minecraft Server',
      description: 'Minecraft game server',
      icon: '⛏️',
    },
  })

  // Create checks
  await prisma.check.createMany({
    data: [
      {
        serviceId: mainWebsite.id,
        name: 'Website HTTP Check',
        type: CheckType.HTTPS,
        target: 'yorkhost.com',
        expectedStatus: 200,
        interval: 60,
        timeout: 10000,
      },
      {
        serviceId: clientPortal.id,
        name: 'Portal HTTP Check',
        type: CheckType.HTTPS,
        target: 'portal.yorkhost.com',
        expectedStatus: 200,
        interval: 120,
        timeout: 15000,
      },
      {
        serviceId: database.id,
        name: 'Database TCP Check',
        type: CheckType.TCP,
        target: 'db.internal.yorkhost.com',
        port: 5432,
        interval: 30,
        timeout: 5000,
      },
      {
        serviceId: restAPI.id,
        name: 'API Health Check',
        type: CheckType.HTTPS,
        target: 'api.yorkhost.com/health',
        expectedStatus: 200,
        expectedBody: 'OK',
        interval: 60,
        timeout: 10000,
      },
      {
        serviceId: cdn.id,
        name: 'CDN HTTP Check',
        type: CheckType.HTTPS,
        target: 'cdn.yorkhost.com',
        expectedStatus: 200,
        interval: 300,
        timeout: 10000,
      },
      {
        serviceId: minecraft.id,
        name: 'Minecraft TCP Check',
        type: CheckType.TCP,
        target: 'mc.yorkhost.com',
        port: 25565,
        interval: 120,
        timeout: 5000,
      },
    ],
  })

  // Generate sample check results for the last 30 days
  const checks = await prisma.check.findMany()
  const now = new Date()
  
  for (const check of checks) {
    const results = []
    
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)
      
      // Generate hourly results
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(date)
        timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
        
        // 99% uptime simulation
        const isSuccess = Math.random() > 0.01
        
        results.push({
          checkId: check.id,
          success: isSuccess,
          responseTime: isSuccess ? Math.floor(Math.random() * 500) + 50 : null,
          statusCode: isSuccess ? 200 : Math.random() > 0.5 ? 500 : 503,
          error: isSuccess ? null : 'Connection timeout',
          timestamp,
        })
      }
    }
    
    await prisma.checkResult.createMany({
      data: results,
    })
  }

  // Create a sample incident
  await prisma.incident.create({
    data: {
      title: 'Database Connection Issues',
      description: 'Experiencing intermittent database connection timeouts',
      status: IncidentStatus.RESOLVED,
      severity: IncidentSeverity.HIGH,
      serviceId: database.id,
      machineId: dbServer.id,
      createdBy: 'seed-user',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updates: {
        create: [
          {
            title: 'Investigating',
            message: 'We are investigating reports of database connectivity issues.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            title: 'Identified',
            message: 'Issue identified as network congestion. Implementing mitigation.',
            timestamp: new Date(Date.now() - 90 * 60 * 1000),
          },
          {
            title: 'Resolved',
            message: 'Network issues resolved. All services are operating normally.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
          },
        ],
      },
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })