import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import SchedulerService from '@/lib/scheduler';
import clientPromise from '@/lib/mongodb';

// Get user's scheduled posts
async function getScheduledPosts(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');

    const userId = request.user.userId;
    const schedulerService = SchedulerService.getInstance();

    // Build date range filter
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Get scheduled posts
    const scheduledPosts = await schedulerService.getScheduledPosts(userId, dateRange);

    // Apply additional filters
    let filteredPosts = scheduledPosts;

    if (status) {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }

    if (platform) {
      filteredPosts = filteredPosts.filter(post => 
        post.platforms.includes(platform as any)
      );
    }

    // Format response
    const formattedPosts = filteredPosts.map(scheduledPost => ({
      id: scheduledPost.id,
      postId: scheduledPost.postId,
      scheduledTime: scheduledPost.scheduledTime,
      platforms: scheduledPost.platforms,
      status: scheduledPost.status,
      publishResults: scheduledPost.publishResults,
      retryCount: scheduledPost.retryCount,
      createdAt: scheduledPost.createdAt,
      post: scheduledPost.postId ? {
        id: scheduledPost.postId._id,
        content: scheduledPost.postId.content,
        image: scheduledPost.postId.image,
        video: scheduledPost.postId.video,
        type: scheduledPost.postId.type
      } : null
    }));

    return NextResponse.json({
      scheduledPosts: formattedPosts,
      total: formattedPosts.length,
      filters: {
        startDate,
        endDate,
        status,
        platform
      }
    });

  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getScheduledPosts);