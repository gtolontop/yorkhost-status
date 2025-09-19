import { PrismaClient, CheckType, IncidentStatus, IncidentSeverity } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create sample machines
  const webMachine = await prisma.machine.upsert({
    where: { id: "web-server-1" },
    update: {},
    create: {
      id: "web-server-1",
      name: "Serveur Web Principal",
      description: "Serveur principal pour les applications web Yorkhost",
      category: "web",
      location: "Paris, France",
      tags: ["production", "web", "nginx"],
      isActive: true
    }
  })

  const apiMachine = await prisma.machine.upsert({
    where: { id: "api-server-1" },
    update: {},
    create: {
      id: "api-server-1",
      name: "Serveur API",
      description: "Serveur API REST pour les applications",
      category: "api",
      location: "Paris, France",
      tags: ["production", "api", "rest"],
      isActive: true
    }
  })

  // Create sample admin user
  const adminUser = await prisma.user.upsert({
    where: { discordId: "sample-discord-id" },
    update: {},
    create: {
      id: "admin-user-1",
      discordId: "sample-discord-id",
      username: "Admin",
      avatar: null,
      email: "admin@yorkhost.fr"
    }
  })

  // Create sample services
  const websiteService = await prisma.service.upsert({
    where: { id: "website-service" },
    update: {},
    create: {
      id: "website-service",
      machineId: webMachine.id,
      name: "Site Web Principal",
      description: "Site web principal de Yorkhost",
      url: "https://yorkhost.fr",
      icon: "🌐",
      isActive: true
    }
  })

  const apiService = await prisma.service.upsert({
    where: { id: "api-service" },
    update: {},
    create: {
      id: "api-service",
      machineId: apiMachine.id,
      name: "API REST",
      description: "API REST pour les applications",
      url: "https://api.yorkhost.fr",
      icon: "⚡",
      isActive: true
    }
  })

  // Create sample checks
  const websiteCheck = await prisma.check.upsert({
    where: { id: "website-http-check" },
    update: {},
    create: {
      id: "website-http-check",
      serviceId: websiteService.id,
      name: "Vérification HTTP Site Web",
      type: CheckType.HTTP,
      target: "https://yorkhost.fr",
      timeout: 30,
      interval: 300,
      retryAttempts: 3,
      expectedStatus: 200,
      isActive: true
    }
  })

  console.log("✅ Database seeded successfully\!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
