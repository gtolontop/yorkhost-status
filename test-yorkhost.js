// Test script to check yorkhost.fr status
const { executeCheck } = require('./src/lib/monitoring/checker.ts')

async function testYorkhost() {
  console.log('Testing https://yorkhost.fr/...\n')
  
  // Test with HTTPS check type
  console.log('1. Testing HTTPS check type:')
  try {
    const httpsResult = await executeCheck('HTTPS', 'https://yorkhost.fr/', null, 15000)
    console.log('   Result:', httpsResult)
    console.log('   Status:', httpsResult.success ? 'UP ✅' : 'DOWN ❌')
    if (httpsResult.error) console.log('   Error:', httpsResult.error)
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n2. Testing HTTP check type with full URL:')
  try {
    const httpResult = await executeCheck('HTTP', 'https://yorkhost.fr/', null, 15000)
    console.log('   Result:', httpResult)
    console.log('   Status:', httpResult.success ? 'UP ✅' : 'DOWN ❌')
    if (httpResult.error) console.log('   Error:', httpResult.error)
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n3. Testing with domain only:')
  try {
    const domainResult = await executeCheck('HTTPS', 'yorkhost.fr', null, 15000)
    console.log('   Result:', domainResult)
    console.log('   Status:', domainResult.success ? 'UP ✅' : 'DOWN ❌')
    if (domainResult.error) console.log('   Error:', domainResult.error)
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test using manual fetch
  console.log('\n4. Testing with manual fetch:')
  try {
    const startTime = Date.now()
    const response = await fetch('https://yorkhost.fr/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    const responseTime = Date.now() - startTime
    console.log('   Status Code:', response.status)
    console.log('   Status Text:', response.statusText)
    console.log('   Response Time:', responseTime + 'ms')
    console.log('   Success:', response.status >= 200 && response.status < 400 ? 'UP ✅' : 'DOWN ❌')
    console.log('   Headers:', Object.fromEntries(response.headers.entries()))
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test with axios
  console.log('\n5. Testing with axios:')
  try {
    const axios = require('axios')
    const startTime = Date.now()
    const response = await axios.get('https://yorkhost.fr/', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      validateStatus: () => true,
      maxRedirects: 5
    })
    const responseTime = Date.now() - startTime
    console.log('   Status Code:', response.status)
    console.log('   Status Text:', response.statusText)
    console.log('   Response Time:', responseTime + 'ms')
    console.log('   Success:', response.status >= 200 && response.status < 400 ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
    if (error.response) {
      console.log('   Response Status:', error.response.status)
    }
  }
}

testYorkhost().catch(console.error)