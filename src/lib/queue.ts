import redis from './redis';

export interface JobData {
  id: string;
  type: string;
  payload: any;
  scheduledTime: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface QueueJob {
  id: string;
  data: JobData;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export class QueueService {
  private static instance: QueueService;
  
  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Add a job to the queue
   */
  async addJob(jobData: JobData): Promise<string> {
    const job: QueueJob = {
      id: jobData.id,
      data: jobData
    };

    // Store job data
    await redis.hset(`job:${job.id}`, {
      data: JSON.stringify(job),
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Add to scheduled jobs sorted set (sorted by scheduled time)
    const score = jobData.scheduledTime.getTime();
    await redis.zadd('scheduled:jobs', score, job.id);

    return job.id;
  }

  /**
   * Get jobs that are ready to be processed
   */
  async getReadyJobs(limit: number = 10): Promise<QueueJob[]> {
    const now = Date.now();
    
    // Get job IDs that are ready (scheduled time <= now)
    const jobIds = await redis.zrangebyscore('scheduled:jobs', 0, now, 'LIMIT', 0, limit);
    
    if (jobIds.length === 0) {
      return [];
    }

    // Get job data for each ID
    const jobs: QueueJob[] = [];
    
    for (const jobId of jobIds) {
      const jobData = await redis.hget(`job:${jobId}`, 'data');
      if (jobData) {
        try {
          const job = JSON.parse(jobData) as QueueJob;
          jobs.push(job);
        } catch (error) {
          console.error('Error parsing job data:', error);
        }
      }
    }

    return jobs;
  }

  /**
   * Mark a job as processing
   */
  async markJobProcessing(jobId: string): Promise<void> {
    await redis.hset(`job:${jobId}`, {
      status: 'processing',
      processedAt: new Date().toISOString()
    });

    // Remove from scheduled jobs
    await redis.zrem('scheduled:jobs', jobId);
    
    // Add to processing jobs
    await redis.sadd('processing:jobs', jobId);
  }

  /**
   * Mark a job as completed
   */
  async markJobCompleted(jobId: string, result?: any): Promise<void> {
    await redis.hset(`job:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: result ? JSON.stringify(result) : ''
    });

    // Remove from processing jobs
    await redis.srem('processing:jobs', jobId);
    
    // Add to completed jobs with expiration (keep for 24 hours)
    await redis.setex(`completed:job:${jobId}`, 86400, '1');
  }

  /**
   * Mark a job as failed
   */
  async markJobFailed(jobId: string, error: string, shouldRetry: boolean = false): Promise<void> {
    const jobData = await redis.hget(`job:${jobId}`, 'data');
    
    if (shouldRetry && jobData) {
      try {
        const job = JSON.parse(jobData) as QueueJob;
        const retryCount = (job.data.retryCount || 0) + 1;
        const maxRetries = job.data.maxRetries || 3;
        
        if (retryCount <= maxRetries) {
          // Update retry count and reschedule
          job.data.retryCount = retryCount;
          
          // Exponential backoff: retry after 2^retryCount minutes
          const retryDelay = Math.pow(2, retryCount) * 60 * 1000;
          const retryTime = new Date(Date.now() + retryDelay);
          job.data.scheduledTime = retryTime;
          
          await redis.hset(`job:${jobId}`, {
            data: JSON.stringify(job),
            status: 'pending',
            lastError: error,
            retryCount: retryCount.toString()
          });

          // Remove from processing and add back to scheduled
          await redis.srem('processing:jobs', jobId);
          await redis.zadd('scheduled:jobs', retryTime.getTime(), jobId);
          
          return;
        }
      } catch (parseError) {
        console.error('Error parsing job data for retry:', parseError);
      }
    }

    // Mark as permanently failed
    await redis.hset(`job:${jobId}`, {
      status: 'failed',
      failedAt: new Date().toISOString(),
      error: error
    });

    // Remove from processing jobs
    await redis.srem('processing:jobs', jobId);
    
    // Add to failed jobs
    await redis.sadd('failed:jobs', jobId);
  }

  /**
   * Get job status and details
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    const jobData = await redis.hget(`job:${jobId}`, 'data');
    
    if (!jobData) {
      return null;
    }

    try {
      return JSON.parse(jobData) as QueueJob;
    } catch (error) {
      console.error('Error parsing job data:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const exists = await redis.exists(`job:${jobId}`);
    
    if (!exists) {
      return false;
    }

    // Remove from all possible locations
    await redis.zrem('scheduled:jobs', jobId);
    await redis.srem('processing:jobs', jobId);
    
    // Mark as cancelled
    await redis.hset(`job:${jobId}`, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    scheduled: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [scheduled, processing, failed] = await Promise.all([
      redis.zcard('scheduled:jobs'),
      redis.scard('processing:jobs'),
      redis.scard('failed:jobs')
    ]);

    // Count completed jobs (approximate, based on keys with TTL)
    const completedKeys = await redis.keys('completed:job:*');
    const completed = completedKeys.length;

    return {
      scheduled,
      processing,
      completed,
      failed
    };
  }

  /**
   * Clean up old job data
   */
  async cleanup(): Promise<void> {
    // Remove failed jobs older than 7 days
    const failedJobs = await redis.smembers('failed:jobs');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const jobId of failedJobs) {
      const failedAt = await redis.hget(`job:${jobId}`, 'failedAt');
      if (failedAt && new Date(failedAt).getTime() < sevenDaysAgo) {
        await redis.del(`job:${jobId}`);
        await redis.srem('failed:jobs', jobId);
      }
    }
  }
}

export default QueueService.getInstance();