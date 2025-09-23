import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ScheduledPostModel from '@/models/ScheduledPost';
import PostModel from '@/models/Post';
import clientPromise from '@/lib/mongodb';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Get posts for calendar view
async function getCalendarPosts(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const view = searchParams.get('view') || 'month'; // 'month' or 'week'
    const weekStart = searchParams.get('weekStart'); // For week view

    const userId = request.user.userId;

    let startDate: Date;
    let endDate: Date;

    if (view === 'week' && weekStart) {
      const weekStartDate = new Date(weekStart);
      startDate = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday start
      endDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    } else {
      // Month view
      const monthDate = new Date(year, month - 1, 1);
      startDate = startOfMonth(monthDate);
      endDate = endOfMonth(monthDate);
    }

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
    const calendarEvents = [
      // Scheduled posts
      ...scheduledPosts.map(scheduledPost => ({
        id: `scheduled_${scheduledPost.id}`,
        type: 'scheduled',
        title: scheduledPost.postId?.content?.substring(0, 50) + '...' || 'Scheduled Post',
        content: scheduledPost.postId?.content || '',
        date: scheduledPost.scheduledTime,
        platforms: scheduledPost.platforms,
        status: scheduledPost.status,
        postId: scheduledPost.postId?._id,
        scheduleId: scheduledPost.id,
        image: scheduledPost.postId?.image,
        video: scheduledPost.postId?.video,
        postType: scheduledPost.postId?.type,
        publishResults: scheduledPost.publishResults,
        retryCount: scheduledPost.retryCount
      })),
      
      // Published posts
      ...publishedPosts.map(post => ({
        id: `published_${post.id}`,
        type: 'published',
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

    // Group events by date for easier calendar rendering
    const eventsByDate: Record<string, any[]> = {};
    
    calendarEvents.forEach(event => {
      const dateKey = event.date.toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    // Get summary statistics
    const stats = {
      totalScheduled: scheduledPosts.filter(p => p.status === 'pending').length,
      totalPublished: publishedPosts.length,
      totalFailed: scheduledPosts.filter(p => p.status === 'failed').length,
      totalProcessing: scheduledPosts.filter(p => p.status === 'processing').length,
      platformBreakdown: {}
    };

    // Calculate platform breakdown
    const allPlatforms = [...scheduledPosts, ...publishedPosts].flatMap(p => 
      'platforms' in p ? p.platforms : (p as any).platforms
    );
    
    allPlatforms.forEach(platform => {
      stats.platformBreakdown[platform] = (stats.platformBreakdown[platform] || 0) + 1;
    });

    return NextResponse.json({
      events: calendarEvents,
      eventsByDate,
      dateRange: {
        start: startDate,
        end: endDate
      },
      view,
      stats
    });

  } catch (error) {
    console.error('Error fetching calendar posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar posts' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getCalendarPosts);