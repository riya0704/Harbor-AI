import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import BusinessContextModel from '@/models/BusinessContext';
import clientPromise from '@/lib/mongodb';
import CacheService, { CacheKeys } from '@/lib/cache';

// Get user's business context
async function getBusinessContext(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const cache = CacheService.getInstance();
    const userId = request.user.userId;

    // Try cache first
    const cachedContext = await cache.get(CacheKeys.businessContext(userId));
    if (cachedContext) {
      return NextResponse.json({ businessContext: cachedContext });
    }

    // Fallback to database
    const businessContext = await BusinessContextModel.findOne({ userId });

    if (!businessContext) {
      return NextResponse.json({ businessContext: null });
    }

    // Cache the result
    await cache.set(CacheKeys.businessContext(userId), businessContext, 3600); // 1 hour

    return NextResponse.json({ businessContext });
  } catch (error) {
    console.error('Error fetching business context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business context' },
      { status: 500 }
    );
  }
}

// Save or update user's business context
async function saveBusinessContext(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const {
      businessName,
      industry,
      targetAudience,
      brandVoice,
      keyTopics,
      contentPreferences
    } = body;

    // Validate required fields
    if (!businessName || !industry || !targetAudience || !brandVoice) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, industry, targetAudience, brandVoice' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;
    const cache = CacheService.getInstance();

    // Check if context already exists
    const existingContext = await BusinessContextModel.findOne({ userId });

    let businessContext;

    if (existingContext) {
      // Update existing context
      existingContext.businessName = businessName;
      existingContext.industry = industry;
      existingContext.targetAudience = targetAudience;
      existingContext.brandVoice = brandVoice;
      existingContext.keyTopics = keyTopics || [];
      existingContext.contentPreferences = contentPreferences || {
        tone: 'professional',
        style: 'informative',
        persona: 'expert'
      };
      
      businessContext = await existingContext.save();
    } else {
      // Create new context
      businessContext = new BusinessContextModel({
        userId,
        businessName,
        industry,
        targetAudience,
        brandVoice,
        keyTopics: keyTopics || [],
        contentPreferences: contentPreferences || {
          tone: 'professional',
          style: 'informative',
          persona: 'expert'
        }
      });
      
      await businessContext.save();
    }

    // Update cache
    await cache.set(CacheKeys.businessContext(userId), businessContext, 3600);

    return NextResponse.json({ 
      businessContext,
      message: 'Business context saved successfully' 
    });
  } catch (error) {
    console.error('Error saving business context:', error);
    return NextResponse.json(
      { error: 'Failed to save business context' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getBusinessContext);
export const POST = withAuth(saveBusinessContext);