import BusinessContextModel, { BusinessContextDocument } from '@/models/BusinessContext';
import ChatSessionModel, { ChatSessionDocument, ChatMessage } from '@/models/ChatSession';
import { getContentSuggestions } from '@/ai/flows/get-content-suggestions';
import { generateSocialMediaContent } from '@/ai/flows/generate-social-media-content';
import { refineGeneratedContent } from '@/ai/flows/refine-generated-content';
import { businessContextChat } from '@/ai/flows/business-context-chat';
import CacheService, { CacheKeys } from './cache';
import { SocialPlatform } from './types';

export interface BusinessContext {
  businessName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  keyTopics: string[];
  contentPreferences: {
    tone: string;
    style: string;
    persona: string;
  };
}

export interface ContentGenerationRequest {
  suggestion: string;
  contentType: 'text' | 'image' | 'video';
  tone?: string;
  style?: string;
  persona?: string;
  platform?: SocialPlatform;
}

export interface GeneratedContent {
  text?: string;
  imageCaption?: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoCaption?: string;
  videoUrl?: string;
}

export class AIService {
  private static instance: AIService;
  private cache: CacheService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Save business context for a user
   */
  async saveBusinessContext(userId: string, context: BusinessContext): Promise<BusinessContextDocument> {
    const existingContext = await BusinessContextModel.findOne({ userId });

    let businessContext: BusinessContextDocument;

    if (existingContext) {
      // Update existing context
      Object.assign(existingContext, context);
      businessContext = await existingContext.save();
    } else {
      // Create new context
      businessContext = new BusinessContextModel({
        userId,
        ...context
      });
      await businessContext.save();
    }

    // Update cache
    await this.cache.set(CacheKeys.businessContext(userId), businessContext, 3600);

    return businessContext;
  }

  /**
   * Get business context for a user
   */
  async getBusinessContext(userId: string): Promise<BusinessContextDocument | null> {
    // Try cache first
    const cachedContext = await this.cache.get<BusinessContextDocument>(
      CacheKeys.businessContext(userId)
    );
    
    if (cachedContext) {
      return cachedContext;
    }

    // Fallback to database
    const businessContext = await BusinessContextModel.findOne({ userId });
    
    if (businessContext) {
      // Cache the result
      await this.cache.set(CacheKeys.businessContext(userId), businessContext, 3600);
    }

    return businessContext;
  }

  /**
   * Create a new chat session
   */
  async createChatSession(userId: string): Promise<string> {
    // Deactivate existing active sessions
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
    await this.cache.set(CacheKeys.chatSession(chatSession.id), chatSession, 3600);

    return chatSession.id;
  }

  /**
   * Add message to chat session and get AI response
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<{
    response: ChatMessage;
    isContextComplete: boolean;
    nextQuestion?: string;
    extractedContext?: any;
  }> {
    const session = await ChatSessionModel.findById(sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message
    session.messages.push(message);

    // Get business context
    const businessContext = await this.getBusinessContext(session.userId.toString());

    // Prepare chat history
    const chatHistory = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));

    // Prepare current context
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
      message: message.content,
      chatHistory: chatHistory.slice(0, -1), // Exclude current message
      currentContext
    });

    // Create assistant message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date()
    };

    // Add AI response to session
    session.messages.push(assistantMessage);
    await session.save();

    // Update business context if new information was extracted
    if (aiResponse.extractedContext && Object.keys(aiResponse.extractedContext).length > 0) {
      await this.updateBusinessContextFromChat(session.userId.toString(), aiResponse.extractedContext);
    }

    // Update cache
    await this.cache.set(CacheKeys.chatSession(sessionId), session, 3600);

    return {
      response: assistantMessage,
      isContextComplete: aiResponse.isComplete,
      nextQuestion: aiResponse.nextQuestion,
      extractedContext: aiResponse.extractedContext
    };
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    // Try cache first
    const cachedSession = await this.cache.get<ChatSessionDocument>(
      CacheKeys.chatSession(sessionId)
    );
    
    if (cachedSession) {
      return cachedSession.messages;
    }

    // Fallback to database
    const session = await ChatSessionModel.findById(sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Cache the session
    await this.cache.set(CacheKeys.chatSession(sessionId), session, 3600);

    return session.messages;
  }

  /**
   * Generate content suggestions
   */
  async generateContentSuggestions(
    userId: string,
    platform: SocialPlatform,
    contentGoal: string,
    personaTraits?: string
  ): Promise<string[]> {
    const businessContext = await this.getBusinessContext(userId);
    
    let businessDetails = 'General business';
    if (businessContext) {
      businessDetails = `Business: ${businessContext.businessName}
Industry: ${businessContext.industry}
Target Audience: ${businessContext.targetAudience}
Brand Voice: ${businessContext.brandVoice}
Key Topics: ${businessContext.keyTopics.join(', ')}`;
    }

    const result = await getContentSuggestions({
      businessDetails,
      socialMediaPlatform: platform,
      contentGoal,
      personaTraits: personaTraits || 'professional, engaging'
    });

    return result.suggestions;
  }

  /**
   * Generate content from suggestion
   */
  async generateContent(
    userId: string,
    request: ContentGenerationRequest
  ): Promise<GeneratedContent> {
    const businessContext = await this.getBusinessContext(userId);
    
    let businessDetails = 'General business';
    let tone = request.tone || 'professional';
    let style = request.style || 'informative';
    let persona = request.persona || 'expert';

    if (businessContext) {
      businessDetails = `Business: ${businessContext.businessName}
Industry: ${businessContext.industry}
Target Audience: ${businessContext.targetAudience}
Brand Voice: ${businessContext.brandVoice}
Key Topics: ${businessContext.keyTopics.join(', ')}`;

      // Use business context preferences if not provided
      tone = request.tone || businessContext.contentPreferences.tone;
      style = request.style || businessContext.contentPreferences.style;
      persona = request.persona || businessContext.contentPreferences.persona;
    }

    const result = await generateSocialMediaContent({
      businessDetails,
      contentType: request.contentType,
      suggestion: request.suggestion,
      tone,
      style,
      persona
    });

    return result;
  }

  /**
   * Refine generated content
   */
  async refineContent(
    userId: string,
    originalContent: string,
    feedback: string,
    tone?: string,
    persona?: string
  ): Promise<string> {
    const businessContext = await this.getBusinessContext(userId);
    
    let finalTone = tone || 'professional';
    let finalPersona = persona || 'expert';

    if (businessContext && businessContext.contentPreferences) {
      finalTone = tone || businessContext.contentPreferences.tone;
      finalPersona = persona || businessContext.contentPreferences.persona;
    }

    const result = await refineGeneratedContent({
      originalContent,
      feedback,
      tone: finalTone,
      persona: finalPersona
    });

    return result.refinedContent;
  }

  /**
   * Update business context from chat extraction
   */
  private async updateBusinessContextFromChat(userId: string, extractedContext: any): Promise<void> {
    const existingContext = await BusinessContextModel.findOne({ userId });

    if (existingContext) {
      // Update existing context
      if (extractedContext.businessName) {
        existingContext.businessName = extractedContext.businessName;
      }
      if (extractedContext.industry) {
        existingContext.industry = extractedContext.industry;
      }
      if (extractedContext.targetAudience) {
        existingContext.targetAudience = extractedContext.targetAudience;
      }
      if (extractedContext.brandVoice) {
        existingContext.brandVoice = extractedContext.brandVoice;
      }
      if (extractedContext.keyTopics) {
        existingContext.keyTopics = extractedContext.keyTopics;
      }
      if (extractedContext.contentPreferences) {
        existingContext.contentPreferences = {
          ...existingContext.contentPreferences,
          ...extractedContext.contentPreferences
        };
      }
      
      await existingContext.save();
    } else if (
      extractedContext.businessName && 
      extractedContext.industry && 
      extractedContext.targetAudience && 
      extractedContext.brandVoice
    ) {
      // Create new context if we have enough information
      const newContext = new BusinessContextModel({
        userId,
        businessName: extractedContext.businessName,
        industry: extractedContext.industry,
        targetAudience: extractedContext.targetAudience,
        brandVoice: extractedContext.brandVoice,
        keyTopics: extractedContext.keyTopics || [],
        contentPreferences: extractedContext.contentPreferences || {
          tone: 'professional',
          style: 'informative',
          persona: 'expert'
        }
      });
      
      await newContext.save();
    }

    // Clear cache to force refresh
    await this.cache.delete(CacheKeys.businessContext(userId));
  }

  /**
   * Get AI service statistics
   */
  async getStats(userId: string): Promise<{
    hasBusinessContext: boolean;
    activeChatSessions: number;
    totalChatSessions: number;
    totalMessages: number;
  }> {
    const [businessContext, activeSessions, totalSessions] = await Promise.all([
      this.getBusinessContext(userId),
      ChatSessionModel.countDocuments({ userId, isActive: true }),
      ChatSessionModel.countDocuments({ userId })
    ]);

    // Count total messages across all sessions
    const sessions = await ChatSessionModel.find({ userId }).select('messages');
    const totalMessages = sessions.reduce((total, session) => total + session.messages.length, 0);

    return {
      hasBusinessContext: !!businessContext,
      activeChatSessions: activeSessions,
      totalChatSessions: totalSessions,
      totalMessages
    };
  }
}

export default AIService;