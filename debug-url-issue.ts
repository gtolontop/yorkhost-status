// Debug the URL parsing issue more specifically

async function debugUrlIssue() {
  console.log('Debugging URL parsing issue...\n')
  
  const problematicUrl = 'httpbin.org/status/404'
  console.log(`Original URL: "${problematicUrl}"`)
  
  // Replicate the URL processing logic from the checker
  const finalUrl = problematicUrl.startsWith('http') ? problematicUrl : `https://${problematicUrl}`
  console.log(`Final URL: "${finalUrl}"`)
  
  // Test if this URL is actually valid
  try {
    const url = new URL(finalUrl)
    console.log('URL object created successfully:', url.toString())
  } catch (error) {
    console.log('URL object creation failed:', error.message)
    return
  }
  
  // Try the fetch directly
  console.log('\nTesting fetch directly...')
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    console.log('Fetch succeeded!')
    console.log('Response status:', response.status)
    console.log('Response time:', responseTime, 'ms')
    console.log('Response OK:', response.ok)
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log('Fetch failed!')
    console.log('Error message:', error.message)
    console.log('Response time:', responseTime, 'ms')
    console.log('Error type:', error.constructor.name)
    console.log('Full error:', error)
  }
}

debugUrlIssue().catch(console.error)