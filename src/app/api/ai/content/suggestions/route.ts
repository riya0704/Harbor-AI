import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import BusinessContextModel from '@/models/BusinessContext';
import { getContentSuggestions } from '@/ai/flows/get-content-suggestions';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';
import crypto from 'crypto';

// Generate content suggestions
async function generateSuggestions(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const { 
      socialMediaPlatform, 
      contentGoal, 
      personaTraits,
      useBusinessContext = true 
    } = body;

    // Validate required fields
    if (!socialMediaPlatform || !contentGoal) {
      return NextResponse.json(
        { error: 'socialMediaPlatform and contentGoal are required' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;
    const cache = CacheService.getInstance();

    // Get business context if requested
    let businessDetails = '';
    if (useBusinessContext) {
      const businessContext = await BusinessContextModel.findOne({ userId });
      if (businessContext) {
        businessDetails = `Business: ${businessContext.businessName}
Industry: ${businessContext.industry}
Target Audience: ${businessContext.targetAudience}
Brand Voice: ${businessContext.brandVoice}
Key Topics: ${businessContext.keyTopics.join(', ')}
Content Preferences: ${JSON.stringify(businessContext.contentPreferences)}`;
      }
    }

    // Create cache key based on input parameters
    const inputHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ socialMediaPlatform, contentGoal, personaTraits, businessDetails }))
      .digest('hex');
    
    const cacheKey = CacheKeys.generatedContent(userId, `suggestions_${inputHash}`);

    // Check cache first
    const cachedSuggestions = await cache.get<{ suggestions: string[] }>(cacheKey);
    if (cachedSuggestions) {
      return NextResponse.json({
        suggestions: cachedSuggestions.suggestions,
        cached: true
      });
    }

    // Generate new suggestions
    const result = await getContentSuggestions({
      businessDetails: businessDetails || 'General business',
      socialMediaPlatform,
      contentGoal,
      personaTraits: personaTraits || 'professional, engaging'
    });

    // Cache the results for 30 minutes
    await cache.set(cacheKey, result, 1800);

    return NextResponse.json({
      suggestions: result.suggestions,
      cached: false
    });

  } catch (error) {
    console.error('Error generating content suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate content suggestions' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(generateSuggestions);