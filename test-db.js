const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();