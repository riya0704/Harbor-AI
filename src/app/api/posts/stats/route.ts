import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// Get posts statistics for user
async function getPostsStats(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Mock data for now - in a real implementation, this would query the database
    const mockStats = {
      userStats: {
        overview: {
          totalScheduled: 45,
          pendingPosts: 12,
          publishedPosts: 38,
          failedPosts: 3,
          processingPosts: 2,
          successRate: Math.round((38 / (38 + 3)) * 100)
        },
        activity: {
          daily: generateMockDailyActivity(days)
        },
        platforms: {
          'Twitter': 18,
          'LinkedIn': 15,
          'Instagram': 12
        },
        upcomingPosts: [
          {
            id: '1',
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            platforms: ['Twitter', 'LinkedIn'],
            content: 'Exciting product update coming tomorrow! Stay tuned for the big announcement.',
            type: 'dynamic'
          },
          {
            id: '2',
            scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            platforms: ['Instagram'],
            content: 'Behind the scenes look at our development process. Check out how we build amazing features!',
            type: 'static'
          },
          {
            id: '3',
            scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            platforms: ['Twitter'],
            content: 'Weekly tech tips: How to optimize your social media strategy for better engagement.',
            type: 'dynamic'
          }
        ]
      }
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching posts stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts statistics' },
      { status: 500 }
    );
  }
}

function generateMockDailyActivity(days: number) {
  const activity = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    activity.push({
      date: date.toISOString().split('T')[0],
      scheduled: Math.floor(Math.random() * 5) + 1,
      published: Math.floor(Math.random() * 4) + 1,
      failed: Math.floor(Math.random() * 2)
    });
  }
  
  return activity;
}

export const GET = withAuth(getPostsStats);