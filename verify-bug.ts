// Verify the bug with domains that start with 'http'

const testDomains = [
  'httpbin.org',
  'httpforever.com', 
  'httpwatch.com',
  'httpbingo.org',
  'httpstat.us',
  'google.com',
  'example.com',
  'https://httpbin.org',
  'http://httpbin.org'
]

console.log('Testing domains to verify the bug:\n')

testDomains.forEach(domain => {
  const startsWithHttp = domain.startsWith('http')
  const startsWithHttpProtocol = domain.startsWith('http://') || domain.startsWith('https://')
  const processedUrl = domain.startsWith('http') ? domain : `https://${domain}`
  
  let urlValid = false
  try {
    new URL(processedUrl)
    urlValid = true
  } catch (e) {
    urlValid = false
  }
  
  console.log(`Domain: ${domain}`)
  console.log(`  Starts with 'http': ${startsWithHttp}`)
  console.log(`  Starts with protocol: ${startsWithHttpProtocol}`)
  console.log(`  Processed URL: ${processedUrl}`)
  console.log(`  Final URL valid: ${urlValid}`)
  console.log()
})