import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import BusinessContextModel from '@/models/BusinessContext';
import { generateSocialMediaContent } from '@/ai/flows/generate-social-media-content';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';
import crypto from 'crypto';

// Generate social media content
async function generateContent(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const { 
      suggestion,
      contentType,
      tone,
      style,
      persona,
      useBusinessContext = true 
    } = body;

    // Validate required fields
    if (!suggestion || !contentType) {
      return NextResponse.json(
        { error: 'suggestion and contentType are required' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!['text', 'image', 'video'].includes(contentType)) {
      return NextResponse.json(
        { error: 'contentType must be one of: text, image, video' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;
    const cache = CacheService.getInstance();

    // Get business context if requested
    let businessDetails = '';
    let contextPreferences = {};
    
    if (useBusinessContext) {
      const businessContext = await BusinessContextModel.findOne({ userId });
      if (businessContext) {
        businessDetails = `Business: ${businessContext.businessName}
Industry: ${businessContext.industry}
Target Audience: ${businessContext.targetAudience}
Brand Voice: ${businessContext.brandVoice}
Key Topics: ${businessContext.keyTopics.join(', ')}`;
        
        contextPreferences = businessContext.contentPreferences;
      }
    }

    // Use provided preferences or fall back to business context
    const finalTone = tone || contextPreferences.tone || 'professional';
    const finalStyle = style || contextPreferences.style || 'informative';
    const finalPersona = persona || contextPreferences.persona || 'expert';

    // Create cache key based on input parameters
    const inputHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ 
        suggestion, 
        contentType, 
        finalTone, 
        finalStyle, 
        finalPersona, 
        businessDetails 
      }))
      .digest('hex');
    
    const cacheKey = CacheKeys.generatedContent(userId, `content_${inputHash}`);

    // Check cache first
    const cachedContent = await cache.get(cacheKey);
    if (cachedContent) {
      return NextResponse.json({
        content: cachedContent,
        cached: true
      });
    }

    // Generate new content
    const result = await generateSocialMediaContent({
      businessDetails: businessDetails || 'General business',
      contentType,
      suggestion,
      tone: finalTone,
      style: finalStyle,
      persona: finalPersona
    });

    // Cache the results for 1 hour
    await cache.set(cacheKey, result, 3600);

    return NextResponse.json({
      content: result,
      cached: false,
      preferences: {
        tone: finalTone,
        style: finalStyle,
        persona: finalPersona
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(generateContent);