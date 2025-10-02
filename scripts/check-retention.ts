import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDataRetention() {
  console.log('=== Vérification de la rétention des données ===\n')

  // Vérifier les 7 derniers jours
  const results = await prisma.$queryRaw<Array<{
    date: Date
    count: bigint
    success_count: bigint
  }>>`
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE success = true) as success_count
    FROM check_results
    WHERE timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `

  console.log('Données des 7 derniers jours:')
  console.log('Date         | Total | Succès | Uptime %')
  console.log('-------------|-------|--------|----------')

  for (const row of results) {
    const total = Number(row.count)
    const success = Number(row.success_count)
    const uptime = total > 0 ? ((success / total) * 100).toFixed(2) : '0.00'
    console.log(`${row.date.toISOString().split('T')[0]} | ${total.toString().padStart(5)} | ${success.toString().padStart(6)} | ${uptime}%`)
  }

  // Vérifier les services avec leurs données
  console.log('\n=== Données par service ===\n')

  const serviceData = await prisma.$queryRaw<Array<{
    service_name: string
    date: Date
    count: bigint
    success_count: bigint
  }>>`
    SELECT
      s.name as service_name,
      DATE(cr.timestamp) as date,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE cr.success = true) as success_count
    FROM check_results cr
    JOIN checks c ON c.id = cr."checkId"
    JOIN services s ON s.id = c."serviceId"
    WHERE cr.timestamp >= NOW() - INTERVAL '3 days'
    GROUP BY s.name, DATE(cr.timestamp)
    ORDER BY s.name, date DESC
    LIMIT 50
  `

  console.log('Service                | Date       | Total | Succès')
  console.log('-----------------------|------------|-------|--------')

  for (const row of serviceData) {
    const total = Number(row.count)
    const success = Number(row.success_count)
    console.log(`${row.service_name.padEnd(22)} | ${row.date.toISOString().split('T')[0]} | ${total.toString().padStart(5)} | ${success.toString().padStart(6)}`)
  }

  await prisma.$disconnect()
}

checkDataRetention().catch(console.error)
