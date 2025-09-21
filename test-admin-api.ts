import axios from 'axios'

async function testAdminAPI() {
  console.log('🧪 Testing admin services API...\n')
  
  // First, let's login to get a token (normally you'd do this via the UI)
  // For testing, we'll just check the response structure
  
  try {
    const response = await axios.get('http://localhost:3000/api/admin/services', {
      headers: {
        // This will fail auth but we can see the structure
        'Authorization': 'Bearer dummy-token'
      }
    })
    console.log('Unexpected success!')
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Auth check works correctly')
      console.log('Response:', JSON.stringify(error.response.data, null, 2))
    }
  }
  
  // Test public services endpoint to compare
  console.log('\n📊 Comparing with public services endpoint:')
  try {
    const response = await axios.get('http://localhost:3000/api/services')
    console.log(`Found ${response.data.length} services`)
    
    // Show first service structure
    if (response.data.length > 0) {
      const service = response.data[0]
      console.log('\nFirst service:')
      console.log(`- Name: ${service.name}`)
      console.log(`- Status: ${service.status}`)
      console.log(`- Uptime: ${service.uptimePercent24h}%`)
      console.log(`- Checks: ${service.checks?.length || 0}`)
      console.log(`- Last results: ${service.checks?.[0]?.results?.length || 0}`)
    }
  } catch (error: any) {
    console.log('Error:', error.message)
  }
}

testAdminAPI().catch(console.error)