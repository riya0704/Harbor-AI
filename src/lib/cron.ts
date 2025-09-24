import * as cron from 'node-cron';
import SchedulerService from './scheduler';
import QueueService from './queue';

export class CronService {
  private static instance: CronService;
  private schedulerService: SchedulerService;
  private queueService: QueueService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  constructor() {
    this.schedulerService = SchedulerService.getInstance();
    this.queueService = QueueService.getInstance();
  }

  /**
   * Start all cron jobs
   */
  start(): void {
    this.startPostProcessor();
    this.startCleanupJob();
    this.startHealthCheck();
    
    console.log('Cron jobs started');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    
    this.jobs.clear();
    console.log('All cron jobs stopped');
  }

  /**
   * Process scheduled posts every minute
   */
  private startPostProcessor(): void {
    const job = cron.schedule('* * * * *', async () => {
      try {
        await this.schedulerService.processScheduledPosts();
      } catch (error) {
        console.error('Error in post processor cron job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('postProcessor', job);
    job.start();
    console.log('Started post processor cron job (every minute)');
  }

  /**
   * Clean up old jobs and data every hour
   */
  private startCleanupJob(): void {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        await this.queueService.cleanup();
        console.log('Completed cleanup job');
      } catch (error) {
        console.error('Error in cleanup cron job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('cleanup', job);
    job.start();
    console.log('Started cleanup cron job (every hour)');
  }

  /**
   * Health check every 5 minutes
   */
  private startHealthCheck(): void {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const stats = await this.schedulerService.getStats();
        console.log('Scheduler health check:', {
          timestamp: new Date().toISOString(),
          ...stats
        });
      } catch (error) {
        console.error('Error in health check cron job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('healthCheck', job);
    job.start();
    console.log('Started health check cron job (every 5 minutes)');
  }

  /**
   * Get status of all cron jobs
   */
  getJobsStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.jobs.forEach((job, name) => {
      status[name] = job.running;
    });

    return status;
  }

  /**
   * Restart a specific job
   */
  restartJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    
    if (!job) {
      return false;
    }

    job.stop();
    job.start();
    
    console.log(`Restarted cron job: ${jobName}`);
    return true;
  }
}

export default CronService;