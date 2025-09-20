// Test script to verify monitoring functionality
import { executeCheck } from './src/lib/monitoring/checker'

async function testMonitoring() {
  console.log('Testing monitoring functionality...\n')
  
  // Test HTTP check with a working website
  console.log('1. Testing HTTPS check with Google (should be UP):')
  try {
    const httpsResult = await executeCheck('HTTPS', 'https://google.com', null, 5000)
    console.log('   Result:', httpsResult)
    console.log('   Status:', httpsResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n2. Testing HTTPS check with just domain (should be UP):')
  try {
    const httpsResult2 = await executeCheck('HTTPS', 'google.com', null, 5000)
    console.log('   Result:', httpsResult2)
    console.log('   Status:', httpsResult2.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n3. Testing HTTPS check with invalid URL (should be DOWN):')
  try {
    const httpsFailResult = await executeCheck('HTTPS', 'https://thisdomaindoesnotexist12345.com', null, 5000)
    console.log('   Result:', httpsFailResult)
    console.log('   Status:', httpsFailResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n4. Testing HTTP check with valid site (should be UP):')
  try {
    const httpResult = await executeCheck('HTTP', 'http://httpbin.org/status/200', null, 5000)
    console.log('   Result:', httpResult)
    console.log('   Status:', httpResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n5. Testing TCP check with Google on port 80 (should be UP):')
  try {
    const tcpResult = await executeCheck('TCP', 'google.com', 80, 5000)
    console.log('   Result:', tcpResult)
    console.log('   Status:', tcpResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n6. Testing TCP check with Google on port 443 (should be UP):')
  try {
    const tcpResult443 = await executeCheck('TCP', 'google.com', 443, 5000)
    console.log('   Result:', tcpResult443)
    console.log('   Status:', tcpResult443.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n✅ Monitoring test completed!')
}

testMonitoring().catch(console.error)