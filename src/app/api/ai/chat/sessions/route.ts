import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ChatSessionModel from '@/models/ChatSession';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';

// Create a new chat session
async function createChatSession(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const cache = CacheService.getInstance();

    // Deactivate any existing active sessions
    await ChatSessionModel.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Create new session
    const chatSession = new ChatSessionModel({
      userId,
      messages: [],
      isActive: true
    });

    await chatSession.save();

    // Cache the session
    await cache.set(CacheKeys.chatSession(chatSession.id), chatSession, 3600);

    return NextResponse.json({ 
      sessionId: chatSession.id,
      message: 'Chat session created successfully' 
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}

// Get user's chat sessions
async function getChatSessions(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const userId = request.user.userId;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query: any = { userId };
    if (activeOnly) {
      query.isActive = true;
    }

    const sessions = await ChatSessionModel
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('id isActive createdAt updatedAt messages');

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createChatSession);
export const GET = withAuth(getChatSessions);