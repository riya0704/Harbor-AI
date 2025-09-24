import QueueService, { JobData } from './queue';
import ScheduledPostModel, { ScheduledPostDocument } from '@/models/ScheduledPost';
import PostModel from '@/models/Post';
import { SocialPlatform } from './types';

export interface SchedulePostData {
  userId: string;
  postId: string;
  scheduledTime: Date;
  platforms: SocialPlatform[];
}

export class SchedulerService {
  private static instance: SchedulerService;
  private queueService: QueueService;
  
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  constructor() {
    this.queueService = QueueService.getInstance();
  }

  /**
   * Schedule a post for publishing
   */
  async schedulePost(data: SchedulePostData): Promise<string> {
    // Create scheduled post record
    const scheduledPost = new ScheduledPostModel({
      userId: data.userId,
      postId: data.postId,
      scheduledTime: data.scheduledTime,
      platforms: data.platforms,
      status: 'pending',
      publishResults: [],
      retryCount: 0
    });

    await scheduledPost.save();

    // Create job for the queue
    const jobData: JobData = {
      id: `post_${scheduledPost.id}`,
      type: 'publish_post',
      payload: {
        scheduledPostId: scheduledPost.id,
        userId: data.userId,
        postId: data.postId,
        platforms: data.platforms
      },
      scheduledTime: data.scheduledTime,
      maxRetries: 3
    };

    await this.queueService.addJob(jobData);

    return scheduledPost.id;
  }

  /**
   * Update a scheduled post
   */
  async updateScheduledPost(
    scheduleId: string, 
    updates: {
      scheduledTime?: Date;
      platforms?: SocialPlatform[];
    }
  ): Promise<void> {
    const scheduledPost = await ScheduledPostModel.findById(scheduleId);
    
    if (!scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    if (scheduledPost.status !== 'pending') {
      throw new Error('Cannot update post that is not pending');
    }

    // Update the database record
    if (updates.scheduledTime) {
      scheduledPost.scheduledTime = updates.scheduledTime;
    }
    
    if (updates.platforms) {
      scheduledPost.platforms = updates.platforms;
    }

    await scheduledPost.save();

    // Cancel the existing job and create a new one
    const jobId = `post_${scheduleId}`;
    await this.queueService.cancelJob(jobId);

    // Create new job with updated data
    const jobData: JobData = {
      id: jobId,
      type: 'publish_post',
      payload: {
        scheduledPostId: scheduleId,
        userId: scheduledPost.userId.toString(),
        postId: scheduledPost.postId.toString(),
        platforms: scheduledPost.platforms
      },
      scheduledTime: scheduledPost.scheduledTime,
      maxRetries: 3
    };

    await this.queueService.addJob(jobData);
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(scheduleId: string): Promise<void> {
    const scheduledPost = await ScheduledPostModel.findById(scheduleId);
    
    if (!scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    if (scheduledPost.status !== 'pending') {
      throw new Error('Cannot cancel post that is not pending');
    }

    // Update database status
    scheduledPost.status = 'cancelled';
    await scheduledPost.save();

    // Cancel the job
    const jobId = `post_${scheduleId}`;
    await this.queueService.cancelJob(jobId);
  }

  /**
   * Get scheduled posts for a user
   */
  async getScheduledPosts(
    userId: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<ScheduledPostDocument[]> {
    let query: any = { userId };

    if (dateRange) {
      query.scheduledTime = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    return await ScheduledPostModel
      .find(query)
      .populate('postId')
      .sort({ scheduledTime: 1 });
  }

  /**
   * Process ready jobs (called by cron job)
   */
  async processScheduledPosts(): Promise<void> {
    try {
      const readyJobs = await this.queueService.getReadyJobs(10);
      
      for (const job of readyJobs) {
        if (job.data.type === 'publish_post') {
          await this.processPublishJob(job.id, job.data.payload);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  /**
   * Process a single publish job
   */
  private async processPublishJob(jobId: string, payload: any): Promise<void> {
    try {
      await this.queueService.markJobProcessing(jobId);

      const { scheduledPostId, userId, postId, platforms } = payload;

      // Update scheduled post status
      const scheduledPost = await ScheduledPostModel.findById(scheduledPostId);
      if (!scheduledPost) {
        throw new Error('Scheduled post not found');
      }

      scheduledPost.status = 'processing';
      await scheduledPost.save();

      // Get the post content
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // TODO: Implement actual publishing to social media platforms
      // This will be implemented in the social media service
      const publishResults = await this.publishToSocialMedia(post, platforms);

      // Update scheduled post with results
      scheduledPost.publishResults = publishResults;
      scheduledPost.status = publishResults.every(r => r.success) ? 'published' : 'failed';
      await scheduledPost.save();

      // Update original post status
      if (scheduledPost.status === 'published') {
        post.status = 'published';
        await post.save();
      }

      await this.queueService.markJobCompleted(jobId, { publishResults });

    } catch (error) {
      console.error('Error processing publish job:', error);
      
      // Update scheduled post status
      try {
        const scheduledPost = await ScheduledPostModel.findById(payload.scheduledPostId);
        if (scheduledPost) {
          scheduledPost.status = 'failed';
          await scheduledPost.save();
        }
      } catch (updateError) {
        console.error('Error updating failed post status:', updateError);
      }

      await this.queueService.markJobFailed(jobId, error.message, true);
    }
  }

  /**
   * Publish post to social media platforms
   */
  private async publishToSocialMedia(post: any, platforms: SocialPlatform[]): Promise<any[]> {
    const PublisherService = (await import('./publisher')).default;
    
    const content = {
      text: post.content,
      image: post.image,
      video: post.video
    };

    return await PublisherService.publishToMultiplePlatforms(
      post.userId.toString(),
      platforms,
      content
    );
  }

  /**
   * Get scheduler statistics
   */
  async getStats(): Promise<{
    queueStats: any;
    scheduledPostsCount: number;
    processingPostsCount: number;
  }> {
    const [queueStats, scheduledPostsCount, processingPostsCount] = await Promise.all([
      this.queueService.getQueueStats(),
      ScheduledPostModel.countDocuments({ status: 'pending' }),
      ScheduledPostModel.countDocuments({ status: 'processing' })
    ]);

    return {
      queueStats,
      scheduledPostsCount,
      processingPostsCount
    };
  }
}

export default SchedulerService;