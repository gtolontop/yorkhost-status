import { executeCheck } from './src/lib/monitoring/checker'
import { CheckType } from '@prisma/client'

async function testYorkhost() {
  console.log('🧪 Testing yorkhost.fr connectivity...\n')
  
  const result = await executeCheck(
    CheckType.HTTPS,
    'https://yorkhost.fr',
    null,
    30000 // 30 second timeout
  )
  
  console.log('\n📊 Test Result:')
  console.log(`Success: ${result.success ? '✅' : '❌'}`)
  console.log(`Response Time: ${result.responseTime}ms`)
  console.log(`Status Code: ${result.statusCode || 'N/A'}`)
  if (result.error) {
    console.log(`Error: ${result.error}`)
  }
}

testYorkhost().catch(console.error)