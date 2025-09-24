import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// Schedule a new post
async function schedulePost(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const body = await request.json();
    const { content, image, video, platforms, scheduledTime, type } = body;

    // Validate required fields
    if (!content || !platforms || !scheduledTime) {
      return NextResponse.json(
        { error: 'Content, platforms, and scheduledTime are required' },
        { status: 400 }
      );
    }

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    const scheduledDateTime = new Date(scheduledTime);
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Mock successful scheduling - in a real implementation, this would save to database
    const mockScheduledPost = {
      id: `scheduled-${Date.now()}`,
      userId,
      content,
      image,
      video,
      platforms,
      scheduledTime: scheduledDateTime.toISOString(),
      type: type || 'dynamic',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    console.log('Post scheduled successfully:', mockScheduledPost);

    return NextResponse.json({ 
      scheduledPost: mockScheduledPost,
      message: 'Post scheduled successfully',
      warnings: [] // Could include platform-specific warnings
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