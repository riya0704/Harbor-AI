import PostModel, { PostDocument } from '@/models/Post';
import ScheduledPostModel, { ScheduledPostDocument } from '@/models/ScheduledPost';
import SchedulerService from './scheduler';
import PublisherService from './publisher';
import { SocialPlatform } from './types';

export interface SchedulePostRequest {
  content: string;
  image?: string;
  video?: string;
  platforms: SocialPlatform[];
  scheduledTime: Date;
  type?: 'dynamic' | 'static';
}

export interface SchedulePostResponse {
  post: PostDocument;
  scheduleId: string;
  validationWarnings?: string[];
}

export interface CalendarEvent {
  id: string;
  type: 'scheduled' | 'published';
  title: string;
  content: string;
  date: Date;
  platforms: SocialPlatform[];
  status: string;
  postId: string;
  scheduleId?: string;
  image?: string;
  video?: string;
  postType?: string;
}

export class ContentSchedulerService {
  private static instance: ContentSchedulerService;
  private schedulerService: SchedulerService;
  private publisherService: PublisherService;

  public static getInstance(): ContentSchedulerService {
    if (!ContentSchedulerService.instance) {
      ContentSchedulerService.instance = new ContentSchedulerService();
    }
    return ContentSchedulerService.instance;
  }

  constructor() {
    this.schedulerService = SchedulerService.getInstance();
    this.publisherService = PublisherService.getInstance();
  }

  /**
   * Schedule a new post
   */
  async schedulePost(userId: string, request: SchedulePostRequest): Promise<SchedulePostResponse> {
    // Validate content for all platforms
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    for (const platform of request.platforms) {
      const validation = this.publisherService.validateContent(platform, {
        text: request.content,
        image: request.image,
        video: request.video
      });

      if (!validation.valid) {
        validationErrors.push(`${platform}: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        validationWarnings.push(`${platform}: ${validation.warnings.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`Content validation failed: ${validationErrors.join('; ')}`);
    }

    // Create post record
    const post = new PostModel({
      userId,
      content: request.content,
      image: request.image,
      video: request.video,
      platforms: request.platforms,
      date: request.scheduledTime,
      status: 'scheduled',
      type: request.type || 'dynamic'
    });

    await post.save();

    // Schedule the post
    const scheduleId = await this.schedulerService.schedulePost({
      userId,
      postId: post.id,
      scheduledTime: request.scheduledTime,
      platforms: request.platforms
    });

    return {
      post,
      scheduleId,
      validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined
    };
  }

  /**
   * Get scheduled posts for a user with optional filters
   */
  async getScheduledPosts(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      platform?: SocialPlatform;
    }
  ): Promise<ScheduledPostDocument[]> {
    let dateRange;
    if (filters?.startDate && filters?.endDate) {
      dateRange = {
        start: filters.startDate,
        end: filters.endDate
      };
    }

    const scheduledPosts = await this.schedulerService.getScheduledPosts(userId, dateRange);

    // Apply additional filters
    let filteredPosts = scheduledPosts;

    if (filters?.status) {
      filteredPosts = filteredPosts.filter(post => post.status === filters.status);
    }

    if (filters?.platform) {
      filteredPosts = filteredPosts.filter(post => 
        post.platforms.includes(filters.platform!)
      );
    }

    return filteredPosts;
  }

  /**
   * Update a scheduled post
   */
  async updateScheduledPost(
    userId: string,
    scheduleId: string,
    updates: {
      scheduledTime?: Date;
      platforms?: SocialPlatform[];
    }
  ): Promise<void> {
    // Verify ownership
    const scheduledPost = await ScheduledPostModel.findOne({
      _id: scheduleId,
      userId
    }).populate('postId');

    if (!scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    if (scheduledPost.status !== 'pending') {
      throw new Error('Cannot update post that is not pending');
    }

    // Validate new platforms if provided
    if (updates.platforms) {
      const validationErrors: string[] = [];

      for (const platform of updates.platforms) {
        const validation = this.publisherService.validateContent(platform, {
          text: scheduledPost.postId.content,
          image: scheduledPost.postId.image,
          video: scheduledPost.postId.video
        });

        if (!validation.valid) {
          validationErrors.push(`${platform}: ${validation.errors.join(', ')}`);
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(`Content validation failed for new platforms: ${validationErrors.join('; ')}`);
      }
    }

    // Update the scheduled post
    await this.schedulerService.updateScheduledPost(scheduleId, updates);
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(userId: string, scheduleId: string): Promise<void> {
    // Verify ownership
    const scheduledPost = await ScheduledPostModel.findOne({
      _id: scheduleId,
      userId
    });

    if (!scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    await this.schedulerService.cancelScheduledPost(scheduleId);
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    // Get scheduled posts in date range
    const scheduledPosts = await ScheduledPostModel.find({
      userId,
      scheduledTime: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('postId')
    .sort({ scheduledTime: 1 });

    // Get published posts in date range
    const publishedPosts = await PostModel.find({
      userId,
      status: 'published',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // Format calendar events
    const events: CalendarEvent[] = [
      // Scheduled posts
      ...scheduledPosts.map(scheduledPost => ({
        id: `scheduled_${scheduledPost.id}`,
        type: 'scheduled' as const,
        title: scheduledPost.postId?.content?.substring(0, 50) + '...' || 'Scheduled Post',
        content: scheduledPost.postId?.content || '',
        date: scheduledPost.scheduledTime,
        platforms: scheduledPost.platforms,
        status: scheduledPost.status,
        postId: scheduledPost.postId?._id?.toString() || '',
        scheduleId: scheduledPost.id,
        image: scheduledPost.postId?.image,
        video: scheduledPost.postId?.video,
        postType: scheduledPost.postId?.type
      })),
      
      // Published posts
      ...publishedPosts.map(post => ({
        id: `published_${post.id}`,
        type: 'published' as const,
        title: post.content.substring(0, 50) + '...',
        content: post.content,
        date: post.date,
        platforms: post.platforms,
        status: post.status,
        postId: post.id,
        image: post.image,
        video: post.video,
        postType: post.type
      }))
    ];

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get scheduling statistics for a user
   */
  async getSchedulingStats(userId: string, days: number = 30): Promise<{
    overview: any;
    platforms: Record<string, number>;
    dailyActivity: any[];
    upcomingPosts: any[];
  }> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalScheduled,
      pendingPosts,
      publishedPosts,
      failedPosts,
      processingPosts,
      upcomingPosts
    ] = await Promise.all([
      ScheduledPostModel.countDocuments({ userId }),
      ScheduledPostModel.countDocuments({ userId, status: 'pending' }),
      ScheduledPostModel.countDocuments({ userId, status: 'published' }),
      ScheduledPostModel.countDocuments({ userId, status: 'failed' }),
      ScheduledPostModel.countDocuments({ userId, status: 'processing' }),
      ScheduledPostModel.find({
        userId,
        status: 'pending',
        scheduledTime: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
      .populate('postId', 'content type')
      .sort({ scheduledTime: 1 })
      .limit(5)
    ]);

    // Get platform breakdown
    const platformStats = await ScheduledPostModel.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$platforms' },
      { $group: { _id: '$platforms', count: { $sum: 1 } } }
    ]);

    // Get daily activity
    const dailyActivity = await ScheduledPostModel.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      overview: {
        totalScheduled,
        pendingPosts,
        publishedPosts,
        failedPosts,
        processingPosts,
        successRate: totalScheduled > 0 ? Math.round((publishedPosts / totalScheduled) * 100) : 0
      },
      platforms: platformStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      dailyActivity: dailyActivity.map(day => ({
        date: day._id,
        count: day.count
      })),
      upcomingPosts: upcomingPosts.map(post => ({
        id: post.id,
        scheduledTime: post.scheduledTime,
        platforms: post.platforms,
        content: post.postId?.content?.substring(0, 100) + '...' || 'No content',
        type: post.postId?.type || 'unknown'
      }))
    };
  }

  /**
   * Bulk operations on scheduled posts
   */
  async bulkOperation(
    userId: string,
    action: 'cancel' | 'reschedule' | 'update_platforms',
    postIds: string[],
    options?: {
      scheduledTime?: Date;
      platforms?: SocialPlatform[];
    }
  ): Promise<{
    successful: any[];
    failed: any[];
    total: number;
  }> {
    // Verify all posts belong to the user
    const scheduledPosts = await ScheduledPostModel.find({
      _id: { $in: postIds },
      userId
    });

    if (scheduledPosts.length !== postIds.length) {
      throw new Error('Some posts not found or do not belong to user');
    }

    const results = {
      successful: [],
      failed: [],
      total: postIds.length
    };

    for (const post of scheduledPosts) {
      try {
        switch (action) {
          case 'cancel':
            if (post.status === 'pending') {
              await this.schedulerService.cancelScheduledPost(post.id);
              results.successful.push({
                id: post.id,
                message: 'Cancelled successfully'
              });
            } else {
              results.failed.push({
                id: post.id,
                error: `Cannot cancel post with status: ${post.status}`
              });
            }
            break;

          case 'reschedule':
            if (!options?.scheduledTime) {
              throw new Error('scheduledTime is required for reschedule');
            }
            if (post.status === 'pending') {
              await this.schedulerService.updateScheduledPost(post.id, {
                scheduledTime: options.scheduledTime
              });
              results.successful.push({
                id: post.id,
                message: 'Rescheduled successfully'
              });
            } else {
              results.failed.push({
                id: post.id,
                error: `Cannot reschedule post with status: ${post.status}`
              });
            }
            break;

          case 'update_platforms':
            if (!options?.platforms) {
              throw new Error('platforms are required for update_platforms');
            }
            if (post.status === 'pending') {
              await this.schedulerService.updateScheduledPost(post.id, {
                platforms: options.platforms
              });
              results.successful.push({
                id: post.id,
                message: 'Platforms updated successfully'
              });
            } else {
              results.failed.push({
                id: post.id,
                error: `Cannot update platforms for post with status: ${post.status}`
              });
            }
            break;
        }
      } catch (error) {
        results.failed.push({
          id: post.id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get platform-specific posting guidelines
   */
  getPlatformGuidelines(platform: SocialPlatform) {
    return this.publisherService.getPostingGuidelines(platform);
  }
}

export default ContentSchedulerService.getInstance();