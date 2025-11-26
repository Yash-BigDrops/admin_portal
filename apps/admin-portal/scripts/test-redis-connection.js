const { Redis } = require('@upstash/redis')
require('dotenv').config({ path: '.env.local' })

async function testRedis() {
  try {
    console.log('🔍 Testing Redis connection...\n')
    
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (!url || !token) {
      console.error('❌ Missing Redis credentials in .env.local')
      console.log('   UPSTASH_REDIS_REST_URL:', url ? '✅ Set' : '❌ Missing')
      console.log('   UPSTASH_REDIS_REST_TOKEN:', token ? '✅ Set' : '❌ Missing')
      process.exit(1)
    }
    
    console.log('✅ Redis credentials found')
    console.log('   URL:', url.substring(0, 30) + '...')
    console.log('   Token:', token.substring(0, 20) + '...')
    console.log()
    
    const redis = new Redis({
      url,
      token,
    })
    
    // Test connection with a simple ping
    console.log('📡 Testing connection...')
    const testKey = 'test:connection'
    await redis.set(testKey, 'test-value', { ex: 10 })
    const value = await redis.get(testKey)
    
    if (value === 'test-value') {
      console.log('✅ Redis connection successful!')
      console.log('   Rate limiting is now active.')
      
      // Clean up
      await redis.del(testKey)
    } else {
      console.error('❌ Redis connection test failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error.message)
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('   → Check your UPSTASH_REDIS_REST_TOKEN')
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('   → Check your UPSTASH_REDIS_REST_URL')
    }
    process.exit(1)
  }
}

testRedis()

