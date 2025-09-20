async function testPing() {
  const target = '83.150.218.42';
  const timeout = 5000;
  const startTime = Date.now();
  
  try {
    const ping = require('ping');
    
    console.log(`Testing ping to ${target}...`);
    
    const result = await ping.promise.probe(target, {
      timeout: timeout / 1000, // ping expects seconds
      min_reply: 1
    });
    
    console.log('Ping result:', result);
    
    const responseTime = result.alive ? result.time : Date.now() - startTime;
    
    console.log('Final result:', {
      success: result.alive,
      responseTime: responseTime,
      error: result.alive ? undefined : `Ping failed: ${result.output || 'Host unreachable'}`
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log('Ping error:', error.message);
    console.log('Final result:', {
      success: false,
      responseTime,
      error: error.message
    });
  }
}

testPing();