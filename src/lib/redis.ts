import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
})

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  console.log('✅ Connected to Redis')
})

// Initialize connection
if (!redis.isOpen) {
  redis.connect()
}

// Export all cache key helpers required by your app
export const CACHE_KEYS = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  reports: (userId: string) => `reports:${userId}`,
  budgets: (userId: string) => `budgets:${userId}`,
  expenses: (userId: string) => `expenses:${userId}`,
}

export { redis }

// Helper functions for common caching patterns
export const CacheHelpers = {
  // Cache with expiration
  async setWithExpiry(key: string, value: unknown, expirySeconds: number = 3600) {
    return await redis.setEx(key, expirySeconds, JSON.stringify(value))
  },

  // Get cached data
  async get(key: string) {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  },

  // Delete cache
  async delete(key: string) {
    return await redis.del(key)
  },

  // Generate cache key for user-specific data
  userKey(userId: string, type: string, params?: string) {
    return `user:${userId}:${type}${params ? `:${params}` : ''}`
  }
}
