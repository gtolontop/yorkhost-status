import axios from 'axios'
import * as net from 'net'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testAllServices() {
  console.log('🧪 Testing all 3 services that MUST be UP...\n')
  
  // Test 1: https://yorkhost.fr
  console.log('1️⃣ Testing https://yorkhost.fr')
  try {
    const response = await axios.get('https://yorkhost.fr', {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: () => true
    })
    console.log(`   ✅ Status: ${response.status} - ${response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN'}`)
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
  
  // Test 2: https://api.yorkhost.fr  
  console.log('\n2️⃣ Testing https://api.yorkhost.fr')
  try {
    const response = await axios.get('https://api.yorkhost.fr', {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: () => true
    })
    console.log(`   ✅ Status: ${response.status} - ${response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN'}`)
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
  
  // Test 3: 83.150.218.42 (PING)
  console.log('\n3️⃣ Testing 83.150.218.42 (PING)')
  try {
    // Try real ping on Windows
    const { stdout, stderr } = await execAsync(`ping -n 1 -w 5000 83.150.218.42`)
    if (stderr) {
      console.log(`   ❌ Ping failed: ${stderr}`)
    } else {
      const isSuccess = stdout.includes('TTL=') || stdout.includes('time=')
      console.log(`   ${isSuccess ? '✅' : '❌'} Ping result: ${isSuccess ? 'UP' : 'DOWN'}`)
      console.log(`   Raw output: ${stdout.split('\n')[2]}`) // Show the reply line
    }
  } catch (error: any) {
    console.log(`   ❌ Ping error: ${error.message}`)
  }
  
  // Also test TCP connection as fallback
  console.log('\n   Testing TCP fallback on common ports...')
  const ports = [80, 443, 22, 21]
  for (const port of ports) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket()
        socket.setTimeout(2000)
        
        socket.on('connect', () => {
          console.log(`   ✅ TCP port ${port} is OPEN`)
          socket.destroy()
          resolve()
        })
        
        socket.on('timeout', () => {
          socket.destroy()
          reject(new Error('timeout'))
        })
        
        socket.on('error', reject)
        
        socket.connect(port, '83.150.218.42')
      })
      break // Stop on first successful connection
    } catch (e) {
      // Continue trying other ports
    }
  }
}

testAllServices().catch(console.error)