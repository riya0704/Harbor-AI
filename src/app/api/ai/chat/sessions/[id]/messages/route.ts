import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import ChatSessionModel from '@/models/ChatSession';
import BusinessContextModel from '@/models/BusinessContext';
import { businessContextChat } from '@/ai/flows/business-context-chat';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';

// Send message to chat session
async function sendMessage(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const sessionId = params.id;
    const userId = request.user.userId;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get chat session
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

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Get current business context
    const businessContext = await BusinessContextModel.findOne({ userId });
    
    // Add user message to session
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    session.messages.push(userMessage);

    // Prepare chat history for AI
    const chatHistory = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));

    // Prepare current context for AI
    const currentContext = businessContext ? {
      businessName: businessContext.businessName,
      industry: businessContext.industry,
      targetAudience: businessContext.targetAudience,
      brandVoice: businessContext.brandVoice,
      keyTopics: businessContext.keyTopics,
      contentPreferences: businessContext.contentPreferences
    } : undefined;

    // Get AI response
    const aiResponse = await businessContextChat({
      message,
      chatHistory: chatHistory.slice(0, -1), // Exclude the current message
      currentContext
    });

    // Add AI response to session
    const assistantMessage = {
      role: 'assistant' as const,
      content: aiResponse.response,
      timestamp: new Date()
    };
    
    session.messages.push(assistantMessage);

    // Update business context if AI extracted new information
    if (aiResponse.extractedContext && Object.keys(aiResponse.extractedContext).length > 0) {
      if (businessContext) {
        // Update existing context
        if (aiResponse.extractedContext.businessName) {
          businessContext.businessName = aiResponse.extractedContext.businessName;
        }
        if (aiResponse.extractedContext.industry) {
          businessContext.industry = aiResponse.extractedContext.industry;
        }
        if (aiResponse.extractedContext.targetAudience) {
          businessContext.targetAudience = aiResponse.extractedContext.targetAudience;
        }
        if (aiResponse.extractedContext.brandVoice) {
          businessContext.brandVoice = aiResponse.extractedContext.brandVoice;
        }
        if (aiResponse.extractedContext.keyTopics) {
          businessContext.keyTopics = aiResponse.extractedContext.keyTopics;
        }
        if (aiResponse.extractedContext.contentPreferences) {
          businessContext.contentPreferences = {
            ...businessContext.contentPreferences,
            ...aiResponse.extractedContext.contentPreferences
          };
        }
        
        await businessContext.save();
      } else if (aiResponse.extractedContext.businessName && 
                 aiResponse.extractedContext.industry && 
                 aiResponse.extractedContext.targetAudience && 
                 aiResponse.extractedContext.brandVoice) {
        // Create new context if we have enough information
        const newContext = new BusinessContextModel({
          userId,
          businessName: aiResponse.extractedContext.businessName,
          industry: aiResponse.extractedContext.industry,
          targetAudience: aiResponse.extractedContext.targetAudience,
          brandVoice: aiResponse.extractedContext.brandVoice,
          keyTopics: aiResponse.extractedContext.keyTopics || [],
          contentPreferences: aiResponse.extractedContext.contentPreferences || {
            tone: 'professional',
            style: 'informative',
            persona: 'expert'
          }
        });
        
        await newContext.save();
        session.businessContextId = newContext._id;
      }

      // Update cache
      const cache = CacheService.getInstance();
      await cache.delete(CacheKeys.businessContext(userId));
    }

    await session.save();

    // Update session cache
    const cache = CacheService.getInstance();
    await cache.set(CacheKeys.chatSession(sessionId), session, 3600);

    return NextResponse.json({
      message: assistantMessage,
      isContextComplete: aiResponse.isComplete,
      nextQuestion: aiResponse.nextQuestion,
      extractedContext: aiResponse.extractedContext
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(sendMessage);