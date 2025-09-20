// Test edge cases that might cause 0ms response time
import { executeCheck } from './src/lib/monitoring/checker'

async function testEdgeCases() {
  console.log('Testing edge cases that might cause 0ms response time...\n')
  
  // Test 1: Very short timeout
  console.log('1. Testing HTTPS with very short timeout (100ms):')
  try {
    const result = await executeCheck('HTTPS', 'google.com', null, 100)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 2: Invalid protocol
  console.log('\n2. Testing with invalid protocol:')
  try {
    const result = await executeCheck('HTTPS', 'ftp://google.com', null, 5000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 3: Localhost/non-existent
  console.log('\n3. Testing with localhost (probably down):')
  try {
    const result = await executeCheck('HTTPS', 'localhost:8080', null, 2000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 4: Malformed URL
  console.log('\n4. Testing with malformed URL:')
  try {
    const result = await executeCheck('HTTPS', 'not-a-valid-url', null, 5000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 5: Site that returns error status
  console.log('\n5. Testing with site that returns 404:')
  try {
    const result = await executeCheck('HTTPS', 'httpbin.org/status/404', null, 5000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 6: Site that returns 500
  console.log('\n6. Testing with site that returns 500:')
  try {
    const result = await executeCheck('HTTPS', 'httpbin.org/status/500', null, 5000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  // Test 7: Site with slow response
  console.log('\n7. Testing with deliberately slow response (3 second delay):')
  try {
    const result = await executeCheck('HTTPS', 'httpbin.org/delay/3', null, 5000)
    console.log('   Result:', result)
    console.log('   Status:', result.success ? 'UP ✅' : 'DOWN ❌')
  } catch (error) {
    console.log('   Error:', error.message)
  }
  
  console.log('\n✅ Edge case testing completed!')
}

testEdgeCases().catch(console.error)