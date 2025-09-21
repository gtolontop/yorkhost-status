import { executeCheck } from './src/lib/monitoring/checker'
import { CheckType } from '@prisma/client'

async function testAPI() {
  console.log('🧪 Testing api.yorkhost.fr with longer timeout...\n')
  
  const result = await executeCheck(
    CheckType.HTTPS,
    'https://api.yorkhost.fr',
    null,
    60000 // 60 second timeout
  )
  
  console.log('\n📊 Test Result:')
  console.log(`Success: ${result.success ? '✅' : '❌'}`)
  console.log(`Response Time: ${result.responseTime}ms`)
  console.log(`Status Code: ${result.statusCode || 'N/A'}`)
  if (result.error) {
    console.log(`Error: ${result.error}`)
  }
}

testAPI().catch(console.error)