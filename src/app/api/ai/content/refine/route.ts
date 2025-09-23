import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import BusinessContextModel from '@/models/BusinessContext';
import { refineGeneratedContent } from '@/ai/flows/refine-generated-content';
import clientPromise from '@/lib/mongodb';

// Refine generated content based on user feedback
async function refineContent(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const body = await request.json();
    const { 
      originalContent,
      feedback,
      tone,
      persona,
      useBusinessContext = true 
    } = body;

    // Validate required fields
    if (!originalContent || !feedback) {
      return NextResponse.json(
        { error: 'originalContent and feedback are required' },
        { status: 400 }
      );
    }

    const userId = request.user.userId;

    // Get business context preferences if requested
    let contextTone = '';
    let contextPersona = '';
    
    if (useBusinessContext) {
      const businessContext = await BusinessContextModel.findOne({ userId });
      if (businessContext && businessContext.contentPreferences) {
        contextTone = businessContext.contentPreferences.tone;
        contextPersona = businessContext.contentPreferences.persona;
      }
    }

    // Use provided preferences or fall back to business context
    const finalTone = tone || contextTone || 'professional';
    const finalPersona = persona || contextPersona || 'expert';

    // Refine the content
    const result = await refineGeneratedContent({
      originalContent,
      feedback,
      tone: finalTone,
      persona: finalPersona
    });

    return NextResponse.json({
      refinedContent: result.refinedContent,
      preferences: {
        tone: finalTone,
        persona: finalPersona
      }
    });

  } catch (error) {
    console.error('Error refining content:', error);
    return NextResponse.json(
      { error: 'Failed to refine content' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(refineContent);