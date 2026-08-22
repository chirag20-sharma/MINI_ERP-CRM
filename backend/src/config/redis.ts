import Redis, { RedisOptions } from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] || process.env['REDIS_TLS_URL'];

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    // Retry with exponential backoff up to 10 seconds, but stop aggressive retry in local dev
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
};

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = REDIS_URL ? new Redis(REDIS_URL, redisOptions) : new Redis(redisOptions);

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      // Log connection error without crashing the process
      if (process.env['NODE_ENV'] === 'production') {
        console.error('⚠️ Redis error:', err.message);
      }
    });
  }

  return redisClient;
}

export function isRedisConnected(): boolean {
  return isRedisAvailable;
}

