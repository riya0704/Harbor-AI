import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ScheduledPostModel from '@/models/ScheduledPost';
import SchedulerService from '@/lib/scheduler';
import clientPromise from '@/lib/mongodb';

// Bulk operations on scheduled posts
async function bulkOperations(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const { action, postIds, scheduledTime, platforms } = body;

    if (!action || !postIds || !Array.isArray(postIds)) {
      return NextResponse.json(
        { error: 'action and postIds array are required' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;
    const schedulerService = SchedulerService.getInstance();

    // Verify all posts belong to the user and are in valid state
    const scheduledPosts = await ScheduledPostModel.find({
      _id: { $in: postIds },
      userId
    });

    if (scheduledPosts.length !== postIds.length) {
      return NextResponse.json(
        { error: 'Some posts not found or do not belong to user' },
        { status: 404 }
      );
    }

    const results = {
      successful: [],
      failed: [],
      total: postIds.length
    };

    switch (action) {
      case 'cancel':
        // Cancel multiple posts
        for (const post of scheduledPosts) {
          try {
            if (post.status === 'pending') {
              await schedulerService.cancelScheduledPost(post.id);
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
          } catch (error) {
            results.failed.push({
              id: post.id,
              error: error.message
            });
          }
        }
        break;

      case 'reschedule':
        // Reschedule multiple posts
        if (!scheduledTime) {
          return NextResponse.json(
            { error: 'scheduledTime is required for reschedule action' },
            { status: 400 }
          );
        }

        const newScheduledDate = new Date(scheduledTime);
        if (newScheduledDate <= new Date()) {
          return NextResponse.json(
            { error: 'Scheduled time must be in the future' },
            { status: 400 }
          );
        }

        for (const post of scheduledPosts) {
          try {
            if (post.status === 'pending') {
              await schedulerService.updateScheduledPost(post.id, {
                scheduledTime: newScheduledDate
              });
              results.successful.push({
                id: post.id,
                message: 'Rescheduled successfully',
                newScheduledTime: newScheduledDate
              });
            } else {
              results.failed.push({
                id: post.id,
                error: `Cannot reschedule post with status: ${post.status}`
              });
            }
          } catch (error) {
            results.failed.push({
              id: post.id,
              error: error.message
            });
          }
        }
        break;

      case 'update_platforms':
        // Update platforms for multiple posts
        if (!platforms || !Array.isArray(platforms)) {
          return NextResponse.json(
            { error: 'platforms array is required for update_platforms action' },
            { status: 400 }
          );
        }

        const validPlatforms = ['Twitter', 'LinkedIn', 'Instagram'];
        const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
        
        if (invalidPlatforms.length > 0) {
          return NextResponse.json(
            { error: `Invalid platforms: ${invalidPlatforms.join(', ')}` },
            { status: 400 }
          );
        }

        for (const post of scheduledPosts) {
          try {
            if (post.status === 'pending') {
              await schedulerService.updateScheduledPost(post.id, {
                platforms: platforms
              });
              results.successful.push({
                id: post.id,
                message: 'Platforms updated successfully',
                newPlatforms: platforms
              });
            } else {
              results.failed.push({
                id: post.id,
                error: `Cannot update platforms for post with status: ${post.status}`
              });
            }
          } catch (error) {
            results.failed.push({
              id: post.id,
              error: error.message
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: cancel, reschedule, update_platforms' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      action,
      results,
      summary: {
        successful: results.successful.length,
        failed: results.failed.length,
        total: results.total
      }
    });

  } catch (error) {
    console.error('Error in bulk operations:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operations' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(bulkOperations);