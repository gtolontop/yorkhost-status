// Test URL parsing behavior
import { executeCheck } from './src/lib/monitoring/checker'

async function testUrlParsing() {
  console.log('Testing URL parsing behavior...\n')
  
  // Test how the URL formation works
  const testUrls = [
    'google.com',
    'https://google.com',
    'http://google.com',
    'httpbin.org/status/200',
    'https://httpbin.org/status/200',
    'http://httpbin.org/status/404',
    'httpbin.org/status/404',
    'subdomain.example.com/path?query=value',
    'example.com:8080/api/endpoint'
  ]
  
  for (const testUrl of testUrls) {
    console.log(`Testing URL: "${testUrl}"`)
    try {
      const result = await executeCheck('HTTPS', testUrl, null, 3000)
      console.log(`   Result: success=${result.success}, responseTime=${result.responseTime}ms, error="${result.error}"`)
      
      // Show what the final URL would be
      const finalUrl = testUrl.startsWith('http') ? testUrl : `https://${testUrl}`
      console.log(`   Final URL: "${finalUrl}"`)
      
    } catch (error) {
      console.log(`   Error: ${error.message}`)
    }
    console.log()
  }
}

testUrlParsing().catch(console.error)