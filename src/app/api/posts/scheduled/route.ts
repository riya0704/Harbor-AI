import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// Get scheduled posts for user
async function getScheduledPosts(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Mock data for now - in a real implementation, this would query the database
    const mockScheduledPosts = generateMockScheduledPosts(limit);

    return NextResponse.json({ 
      scheduledPosts: mockScheduledPosts,
      total: mockScheduledPosts.length 
    });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

function generateMockScheduledPosts(limit: number) {
  const posts = [];
  const statuses = ['pending', 'published', 'failed', 'cancelled'];
  const platforms = ['Twitter', 'LinkedIn', 'Instagram'];
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + Math.floor(Math.random() * 48));
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const selectedPlatforms = platforms.slice(0, Math.floor(Math.random() * 3) + 1);
    
    posts.push({
      id: `post-${i + 1}`,
      status,
      platforms: selectedPlatforms,
      scheduledTime: scheduledTime.toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      post: {
        content: `This is a sample ${status} post #${i + 1}. It contains engaging content for ${selectedPlatforms.join(' and ')}.`
      },
      publishResults: status === 'failed' ? [
        { platform: selectedPlatforms[0], success: false, error: 'Connection timeout' }
      ] : []
    });
  }
  
  return posts;
}

export const GET = withAuth(getScheduledPosts);