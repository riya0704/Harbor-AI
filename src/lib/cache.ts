import redis from './redis';

export class CacheService {
  private static instance: CacheService;
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a value in cache with optional expiration
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing cached value:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await redis.expire(key, ttlSeconds);
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    
    const values = await redis.mget(...keys);
    
    return values.map(value => {
      if (!value) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error('Error parsing cached value:', error);
        return null;
      }
    });
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    const serializedPairs: string[] = [];
    
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      serializedPairs.push(key, JSON.stringify(value));
    });
    
    if (serializedPairs.length > 0) {
      await redis.mset(...serializedPairs);
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    return await redis.incrby(key, by);
  }

  /**
   * Get keys matching a pattern
   */
  async getKeys(pattern: string): Promise<string[]> {
    return await redis.keys(pattern);
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    await redis.flushall();
  }
}

// Cache key generators for consistent naming
export const CacheKeys = {
  // Social media tokens
  socialToken: (userId: string, platform: string) => `social:token:${userId}:${platform}`,
  
  // User business context
  businessContext: (userId: string) => `business:context:${userId}`,
  
  // Chat sessions
  chatSession: (sessionId: string) => `chat:session:${sessionId}`,
  
  // Generated content cache
  generatedContent: (userId: string, contentHash: string) => `content:generated:${userId}:${contentHash}`,
  
  // Rate limiting
  rateLimit: (userId: string, endpoint: string) => `rate:limit:${userId}:${endpoint}`,
  
  // Scheduled posts queue
  scheduledPost: (postId: string) => `scheduled:post:${postId}`,
  
  // User preferences
  userPreferences: (userId: string) => `user:preferences:${userId}`,
};

export default CacheService.getInstance();