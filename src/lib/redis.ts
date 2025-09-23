import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('Invalid/Missing environment variable: "REDIS_URL"');
}

const redis = new Redis(process.env.REDIS_URL, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export default redis;