async function testGoogleCheck() {
  const target = 'google.com';
  const url = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`;
  console.log('Testing URL:', url);
  
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Yorkhost-Status-Monitor/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.log('Response time:', responseTime + 'ms');
    console.log('Status text:', response.statusText);
    
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Error type:', error.constructor.name);
  }
}

testGoogleCheck();