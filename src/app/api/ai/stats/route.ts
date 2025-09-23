import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import AIService from '@/lib/ai-service';
import clientPromise from '@/lib/mongodb';

// Get AI service statistics for user
async function getAIStats(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const aiService = AIService.getInstance();

    const stats = await aiService.getStats(userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching AI stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAIStats);