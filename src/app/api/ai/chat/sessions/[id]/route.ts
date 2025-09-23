import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ChatSessionModel from '@/models/ChatSession';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';

// Get chat session details
async function getChatSession(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const sessionId = params.id;
    const userId = request.user.userId;
    const cache = CacheService.getInstance();

    // Try cache first
    const cachedSession = await cache.get(CacheKeys.chatSession(sessionId));
    if (cachedSession) {
      // Verify ownership
      if (cachedSession.userId.toString() !== userId) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session: cachedSession });
    }

    // Fallback to database
    const session = await ChatSessionModel.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Cache the session
    await cache.set(CacheKeys.chatSession(sessionId), session, 3600);

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

// Update chat session (e.g., deactivate)
async function updateChatSession(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const sessionId = params.id;
    const userId = request.user.userId;
    const body = await request.json();
    const { isActive, businessContextId } = body;

    const session = await ChatSessionModel.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (typeof isActive === 'boolean') {
      session.isActive = isActive;
    }
    
    if (businessContextId) {
      session.businessContextId = businessContextId;
    }

    await session.save();

    // Update cache
    const cache = CacheService.getInstance();
    await cache.set(CacheKeys.chatSession(sessionId), session, 3600);

    return NextResponse.json({ 
      session,
      message: 'Session updated successfully' 
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getChatSession);
export const PUT = withAuth(updateChatSession);