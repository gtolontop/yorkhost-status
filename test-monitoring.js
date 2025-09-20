// Test script to verify monitoring functionality
const { executeCheck } = require('./src/lib/monitoring/checker')

async function testMonitoring() {
  console.log('Testing monitoring functionality...\n')
  
  // Test HTTP check with a working website
  console.log('1. Testing HTTP check (should be UP):')
  try {
    const httpResult = await executeCheck('HTTP', 'https://google.com', null, 5000)
    console.log('   Result:', httpResult)
    console.log('   Status:', httpResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n2. Testing HTTP check with invalid URL (should be DOWN):')
  try {
    const httpFailResult = await executeCheck('HTTP', 'https://thisdomaindoesnotexist12345.com', null, 5000)
    console.log('   Result:', httpFailResult)
    console.log('   Status:', httpFailResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n3. Testing DNS check (should be UP):')
  try {
    const dnsResult = await executeCheck('DNS', 'google.com', null, 5000)
    console.log('   Result:', dnsResult)
    console.log('   Status:', dnsResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n4. Testing TCP check (should be UP):')
  try {
    const tcpResult = await executeCheck('TCP', 'google.com', 80, 5000)
    console.log('   Result:', tcpResult)
    console.log('   Status:', tcpResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n5. Testing ICMP/Ping check:')
  try {
    const pingResult = await executeCheck('ICMP', 'google.com', null, 5000)
    console.log('   Result:', pingResult)
    console.log('   Status:', pingResult.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n✅ Monitoring test completed!')
}

testMonitoring().catch(console.error)