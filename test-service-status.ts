import axios from 'axios'
import { executeCheck } from './src/lib/monitoring/checker'
import { CheckType } from '@prisma/client'

async function testServiceStatus() {
  console.log('🧪 Testing service status calculation...\n')
  
  // Get services from public API
  try {
    const response = await axios.get('http://localhost:3000/api/services')
    const services = response.data
    
    console.log(`Found ${services.length} services:\n`)
    
    for (const service of services) {
      console.log(`📊 ${service.name}`)
      console.log(`   Status: ${service.status}`)
      console.log(`   Uptime: ${service.uptimePercent24h}%`)
      console.log(`   Checks: ${service.checks?.length || 0}`)
      
      if (service.checks && service.checks.length > 0) {
        const check = service.checks[0]
        console.log(`   Check type: ${check.type}`)
        console.log(`   Target: ${check.target}`)
        console.log(`   Recent results: ${check.results?.length || 0}`)
        
        if (check.results && check.results.length > 0) {
          const lastResult = check.results[0]
          console.log(`   Last result: ${lastResult.success ? '✅' : '❌'} (${lastResult.responseTime}ms)`)
          if (lastResult.error) {
            console.log(`   Error: ${lastResult.error}`)
          }
        }
      }
      
      console.log()
    }
    
    // Now let's do a manual check on one service
    console.log('\n🔧 Running manual check on yorkhost.fr...')
    const result = await executeCheck(
      CheckType.HTTPS,
      'https://yorkhost.fr',
      null,
      30000
    )
    console.log('Result:', result)
    
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

testServiceStatus().catch(console.error)