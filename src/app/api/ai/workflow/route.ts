import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import AIService from '@/lib/ai-service';
import clientPromise from '@/lib/mongodb';

// Handle AI workflow operations (suggestions -> generation -> refinement)
async function handleAIWorkflow(request: AuthenticatedRequest) {
  try {
    // Test basic functionality first
    console.log('Workflow API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { action, ...params } = body;
    const userId = request.user.userId;
    
    console.log('User ID:', userId);
    console.log('Action:', action);

    // Test database connection
    await clientPromise;
    console.log('Database connected');
    
    // Test AI service initialization
    const aiService = AIService.getInstance();
    console.log('AI service initialized');

    switch (action) {
      case 'get_suggestions':
        const { platform, contentGoal, personaTraits } = params;
        
        if (!platform || !contentGoal) {
          return NextResponse.json(
            { error: 'platform and contentGoal are required for suggestions' },
            { status: 400 }
          );
        }

        const suggestions = await aiService.generateContentSuggestions(
          userId,
          platform,
          contentGoal,
          personaTraits
        );

        return NextResponse.json({ suggestions });

      case 'generate_content':
        const { suggestion, contentType, tone, style, persona } = params;
        
        if (!suggestion || !contentType) {
          return NextResponse.json(
            { error: 'suggestion and contentType are required for generation' },
            { status: 400 }
          );
        }

        const content = await aiService.generateContent(userId, {
          suggestion,
          contentType,
          tone,
          style,
          persona
        });

        return NextResponse.json({ content });

      case 'refine_content':
        const { originalContent, feedback, refineTone, refinePersona } = params;
        
        if (!originalContent || !feedback) {
          return NextResponse.json(
            { error: 'originalContent and feedback are required for refinement' },
            { status: 400 }
          );
        }

        const refinedContent = await aiService.refineContent(
          userId,
          originalContent,
          feedback,
          refineTone,
          refinePersona
        );

        return NextResponse.json({ refinedContent });

      case 'complete_workflow':
        console.log('Processing complete_workflow');
        
        // Complete workflow: suggestions -> generation -> optional refinement
        const { 
          workflowPlatform, 
          workflowContentGoal, 
          workflowPersonaTraits,
          selectedSuggestion,
          workflowContentType,
          workflowTone,
          workflowStyle,
          workflowPersona,
          workflowFeedback
        } = params;

        console.log('Workflow params:', { workflowPlatform, workflowContentGoal, workflowContentType });

        if (!workflowPlatform || !workflowContentGoal || !workflowContentType) {
          return NextResponse.json(
            { error: 'workflowPlatform, workflowContentGoal, and workflowContentType are required' },
            { status: 400 }
          );
        }

        try {
          // Step 1: Get suggestions (if no suggestion provided)
          let finalSuggestion = selectedSuggestion;
          if (!finalSuggestion) {
            console.log('Generating suggestions...');
            const workflowSuggestions = await aiService.generateContentSuggestions(
              userId,
              workflowPlatform,
              workflowContentGoal,
              workflowPersonaTraits
            );
            finalSuggestion = workflowSuggestions[0]; // Use first suggestion
            console.log('Generated suggestion:', finalSuggestion);
          }

          // Step 2: Generate content
          console.log('Generating content...');
          let finalContent = await aiService.generateContent(userId, {
            suggestion: finalSuggestion,
            contentType: workflowContentType,
            tone: workflowTone,
            style: workflowStyle,
            persona: workflowPersona
          });
          console.log('Generated content:', finalContent);

          // Step 3: Refine if feedback provided
          if (workflowFeedback && finalContent.text) {
            console.log('Refining content...');
            const refined = await aiService.refineContent(
              userId,
              finalContent.text,
              workflowFeedback,
              workflowTone,
              workflowPersona
            );
            finalContent.text = refined;
            console.log('Refined content:', refined);
          }

          return NextResponse.json({
            suggestion: finalSuggestion,
            content: finalContent,
            refined: !!workflowFeedback
          });
        } catch (workflowError) {
          console.error('Error in workflow processing:', workflowError);
          throw workflowError;
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: get_suggestions, generate_content, refine_content, complete_workflow' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in AI workflow:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI workflow',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleAIWorkflow);