const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTodayData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  console.log('Checking data from:', today.toISOString())
  console.log('To:', tomorrow.toISOString())
  
  const todayResults = await prisma.checkResult.findMany({
    where: {
      timestamp: {
        gte: today,
        lt: tomorrow
      }
    },
    take: 5,
    orderBy: { timestamp: 'desc' }
  })
  
  console.log('\nResults for today:', todayResults.length)
  todayResults.forEach(r => {
    console.log(`- ${r.timestamp.toISOString()} - Success: ${r.success}`)
  })
  
  // Check last few results regardless of date
  const lastResults = await prisma.checkResult.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' }
  })
  
  console.log('\nLast 5 results in DB:')
  lastResults.forEach(r => {
    console.log(`- ${r.timestamp.toISOString()} - Success: ${r.success}`)
  })
  
  await prisma.$disconnect()
}

checkTodayData().catch(console.error)