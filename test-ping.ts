import { executeCheck } from './src/lib/monitoring/checker'
import { CheckType } from '@prisma/client'

async function testPing() {
  console.log('🧪 Testing ICMP ping to 83.150.218.42...\n')
  
  const result = await executeCheck(
    CheckType.ICMP,
    '83.150.218.42',
    null,
    10000 // 10 second timeout
  )
  
  console.log('\n📊 Test Result:')
  console.log(`Success: ${result.success ? '✅' : '❌'}`)
  console.log(`Response Time: ${result.responseTime}ms`)
  if (result.error) {
    console.log(`Error: ${result.error}`)
  }
}

testPing().catch(console.error)