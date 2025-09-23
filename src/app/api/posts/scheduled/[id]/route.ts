import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ScheduledPostModel from '@/models/ScheduledPost';
import SchedulerService from '@/lib/scheduler';
import PublisherService from '@/lib/publisher';
import clientPromise from '@/lib/mongodb';
import { SocialPlatform } from '@/lib/types';

// Update scheduled post
async function updateScheduledPost(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const scheduleId = params.id;
    const body = await request.json();
    const { scheduledTime, platforms } = body;

    // Verify ownership
    const scheduledPost = await ScheduledPostModel.findOne({
      _id: scheduleId,
      userId: request.user.userId
    }).populate('postId');

    if (!scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    if (scheduledPost.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot update post that is not pending' },
        { status: 400 }
      );
    }

    // Validate new scheduled time if provided
    if (scheduledTime) {
      const newScheduledDate = new Date(scheduledTime);
      if (newScheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    // Validate platforms if provided
    if (platforms) {
      const validPlatforms = ['Twitter', 'LinkedIn', 'Instagram'];
      const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
      
      if (invalidPlatforms.length > 0) {
        return NextResponse.json(
          { error: `Invalid platforms: ${invalidPlatforms.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate content for new platforms
      const publisherService = PublisherService.getInstance();
      const validationErrors: string[] = [];

      for (const platform of platforms) {
        const validation = publisherService.validateContent(platform as SocialPlatform, {
          text: scheduledPost.postId.content,
          image: scheduledPost.postId.image,
          video: scheduledPost.postId.video
        });

        if (!validation.valid) {
          validationErrors.push(`${platform}: ${validation.errors.join(', ')}`);
        }
      }

      if (validationErrors.length > 0) {
        return NextResponse.json(
          { 
            error: 'Content validation failed for new platforms',
            details: validationErrors
          },
          { status: 400 }
        );
      }
    }

    // Update the scheduled post
    const schedulerService = SchedulerService.getInstance();
    const updates: any = {};
    
    if (scheduledTime) {
      updates.scheduledTime = new Date(scheduledTime);
    }
    
    if (platforms) {
      updates.platforms = platforms as SocialPlatform[];
    }

    await schedulerService.updateScheduledPost(scheduleId, updates);

    // Get updated post
    const updatedPost = await ScheduledPostModel.findById(scheduleId).populate('postId');

    return NextResponse.json({
      scheduledPost: {
        id: updatedPost!.id,
        postId: updatedPost!.postId,
        scheduledTime: updatedPost!.scheduledTime,
        platforms: updatedPost!.platforms,
        status: updatedPost!.status,
        publishResults: updatedPost!.publishResults,
        retryCount: updatedPost!.retryCount,
        createdAt: updatedPost!.createdAt
      },
      message: 'Scheduled post updated successfully'
    });

  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
}

// Cancel scheduled post
async function cancelScheduledPost(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const scheduleId = params.id;

    // Verify ownership
    const scheduledPost = await ScheduledPostModel.findOne({
      _id: scheduleId,
      userId: request.user.userId
    });

    if (!scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    if (scheduledPost.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot cancel post that is not pending' },
        { status: 400 }
      );
    }

    // Cancel the scheduled post
    const schedulerService = SchedulerService.getInstance();
    await schedulerService.cancelScheduledPost(scheduleId);

    return NextResponse.json({
      message: 'Scheduled post cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
}

// Get specific scheduled post details
async function getScheduledPost(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const scheduleId = params.id;

    // Verify ownership and get post
    const scheduledPost = await ScheduledPostModel.findOne({
      _id: scheduleId,
      userId: request.user.userId
    }).populate('postId');

    if (!scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scheduledPost: {
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
          type: scheduledPost.postId.type,
          status: scheduledPost.postId.status
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled post' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateScheduledPost);
export const DELETE = withAuth(cancelScheduledPost);
export const GET = withAuth(getScheduledPost);