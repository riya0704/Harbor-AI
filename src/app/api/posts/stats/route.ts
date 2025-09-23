import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ScheduledPostModel from '@/models/ScheduledPost';
import PostModel from '@/models/Post';
import SchedulerService from '@/lib/scheduler';
import clientPromise from '@/lib/mongodb';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Get scheduling statistics
async function getSchedulingStats(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const includeSystemStats = searchParams.get('includeSystem') === 'true';

    const userId = request.user.userId;
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // Get user's scheduled posts statistics
    const [
      totalScheduled,
      pendingPosts,
      publishedPosts,
      failedPosts,
      processingPosts,
      cancelledPosts,
      recentActivity
    ] = await Promise.all([
      ScheduledPostModel.countDocuments({ userId }),
      ScheduledPostModel.countDocuments({ userId, status: 'pending' }),
      ScheduledPostModel.countDocuments({ userId, status: 'published' }),
      ScheduledPostModel.countDocuments({ userId, status: 'failed' }),
      ScheduledPostModel.countDocuments({ userId, status: 'processing' }),
      ScheduledPostModel.countDocuments({ userId, status: 'cancelled' }),
      ScheduledPostModel.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Get platform breakdown
    const platformStats = await ScheduledPostModel.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$platforms' },
      { $group: { _id: '$platforms', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get daily activity for the past period
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
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get success rate over time
    const successRate = await ScheduledPostModel.aggregate([
      {
        $match: {
          userId: userId,
          status: { $in: ['published', 'failed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get retry statistics
    const retryStats = await ScheduledPostModel.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$retryCount',
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get upcoming posts (next 7 days)
    const upcomingPosts = await ScheduledPostModel.find({
      userId,
      status: 'pending',
      scheduledTime: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
    .populate('postId', 'content type')
    .sort({ scheduledTime: 1 })
    .limit(5);

    // Calculate success rate percentage
    const successRatePercentage = successRate.length > 0 
      ? Math.round((successRate[0].successful / successRate[0].total) * 100)
      : 0;

    // Format daily activity for chart
    const activityChart = [];
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
      const dayActivity = dailyActivity.filter(activity => activity._id.date === date);
      
      const dayData = {
        date,
        scheduled: dayActivity.find(a => a._id.status === 'pending')?.count || 0,
        published: dayActivity.find(a => a._id.status === 'published')?.count || 0,
        failed: dayActivity.find(a => a._id.status === 'failed')?.count || 0
      };
      
      activityChart.push(dayData);
    }

    const userStats = {
      overview: {
        totalScheduled,
        pendingPosts,
        publishedPosts,
        failedPosts,
        processingPosts,
        cancelledPosts,
        successRate: successRatePercentage
      },
      platforms: platformStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      activity: {
        daily: activityChart,
        recent: recentActivity.map(post => ({
          id: post.id,
          scheduledTime: post.scheduledTime,
          platforms: post.platforms,
          status: post.status,
          createdAt: post.createdAt
        }))
      },
      retries: retryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      upcoming: upcomingPosts.map(post => ({
        id: post.id,
        scheduledTime: post.scheduledTime,
        platforms: post.platforms,
        content: post.postId?.content?.substring(0, 100) + '...' || 'No content',
        type: post.postId?.type || 'unknown'
      }))
    };

    let systemStats = null;
    if (includeSystemStats) {
      // Get system-wide statistics (admin only - you might want to add admin check)
      const schedulerService = SchedulerService.getInstance();
      systemStats = await schedulerService.getStats();
    }

    return NextResponse.json({
      userStats,
      systemStats,
      period: {
        days,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error fetching scheduling stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSchedulingStats);