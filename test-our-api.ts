import axios from 'axios'

async function testOurAPI() {
  console.log('🧪 Testing our status page API endpoints...\n')
  
  const baseUrl = 'http://localhost:3003'
  
  // Test 1: Public status endpoint
  console.log('1️⃣ Testing GET /api/status')
  try {
    const response = await axios.get(`${baseUrl}/api/status`)
    console.log(`   ✅ Status: ${response.status}`)
    console.log(`   Services: ${response.data.services?.length || 0}`)
    console.log(`   Overall Status: ${response.data.overallStatus}`)
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
  
  // Test 2: Services endpoint
  console.log('\n2️⃣ Testing GET /api/services')
  try {
    const response = await axios.get(`${baseUrl}/api/services`)
    console.log(`   ✅ Status: ${response.status}`)
    console.log(`   Services found: ${response.data.length}`)
    
    // Show each service status
    response.data.forEach((service: any) => {
      console.log(`   - ${service.name}: ${service.status} (${service.uptimePercent24h}% uptime)`)
    })
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
  
  // Test 3: Incidents endpoint
  console.log('\n3️⃣ Testing GET /api/incidents')
  try {
    const response = await axios.get(`${baseUrl}/api/incidents`)
    console.log(`   ✅ Status: ${response.status}`)
    console.log(`   Active incidents: ${response.data.incidents?.length || 0}`)
    console.log(`   Active maintenance: ${response.data.maintenances?.length || 0}`)
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
  
  // Test 4: Admin services endpoint (should fail without auth)
  console.log('\n4️⃣ Testing GET /api/admin/services (no auth)')
  try {
    const response = await axios.get(`${baseUrl}/api/admin/services`)
    console.log(`   ❌ Unexpected success: ${response.status}`)
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log(`   ✅ Correctly blocked: 401 Unauthorized`)
    } else {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
  
  // Test 5: Check a specific service
  console.log('\n5️⃣ Testing manual check trigger')
  console.log('   Checking website-service...')
  try {
    // First get the JWT token (normally from login)
    // For testing, we'll show that it requires auth
    const response = await axios.post(`${baseUrl}/api/admin/services/website-service/check`)
    console.log(`   Status: ${response.status}`)
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log(`   ✅ Correctly requires authentication`)
    } else {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
}

testOurAPI().catch(console.error)