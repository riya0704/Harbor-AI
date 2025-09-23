import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import PostModel from '@/models/Post';
import SchedulerService from '@/lib/scheduler';
import PublisherService from '@/lib/publisher';
import clientPromise from '@/lib/mongodb';
import { SocialPlatform } from '@/lib/types';

// Schedule a post for publishing
async function schedulePost(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const {
      content,
      image,
      video,
      platforms,
      scheduledTime,
      type = 'dynamic'
    } = body;

    // Validate required fields
    if (!content || !platforms || !scheduledTime) {
      return NextResponse.json(
        { error: 'content, platforms, and scheduledTime are required' },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = ['Twitter', 'LinkedIn', 'Instagram'];
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Invalid platforms: ${invalidPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate scheduled time (must be in the future)
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;
    const publisherService = PublisherService.getInstance();

    // Validate content for each platform
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    for (const platform of platforms) {
      const validation = publisherService.validateContent(platform as SocialPlatform, {
        text: content,
        image,
        video
      });

      if (!validation.valid) {
        validationErrors.push(`${platform}: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        validationWarnings.push(`${platform}: ${validation.warnings.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Content validation failed',
          details: validationErrors,
          warnings: validationWarnings
        },
        { status: 400 }
      );
    }

    // Create post record
    const post = new PostModel({
      userId,
      content,
      image,
      video,
      platforms,
      date: scheduledDate,
      status: 'scheduled',
      type
    });

    await post.save();

    // Schedule the post
    const schedulerService = SchedulerService.getInstance();
    const scheduleId = await schedulerService.schedulePost({
      userId,
      postId: post.id,
      scheduledTime: scheduledDate,
      platforms: platforms as SocialPlatform[]
    });

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        image: post.image,
        video: post.video,
        platforms: post.platforms,
        scheduledTime: scheduledDate,
        status: post.status,
        type: post.type
      },
      scheduleId,
      warnings: validationWarnings.length > 0 ? validationWarnings : undefined,
      message: 'Post scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(schedulePost);