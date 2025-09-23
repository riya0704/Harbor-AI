import CronService from './cron';
import redis from './redis';

let initialized = false;

/**
 * Initialize background services
 * This should be called once when the application starts
 */
export async function initializeServices(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    // Test Redis connection
    await redis.ping();
    console.log('Redis connection successful');

    // Start cron jobs only in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      const cronService = CronService.getInstance();
      cronService.start();
    }

    initialized = true;
    console.log('Background services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize background services:', error);
    throw error;
  }
}

/**
 * Cleanup services on shutdown
 */
export async function cleanupServices(): Promise<void> {
  if (!initialized) {
    return;
  }

  try {
    // Stop cron jobs
    const cronService = CronService.getInstance();
    cronService.stop();

    // Close Redis connection
    await redis.quit();

    initialized = false;
    console.log('Background services cleaned up successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...');
  await cleanupServices();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up...');
  await cleanupServices();
  process.exit(0);
});

export { CronService, redis };