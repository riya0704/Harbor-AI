interface ContentRefinementRequest {
  originalContent: string;
  feedback: string;
  tone: string;
  persona: string;
}

interface ContentRefinementResponse {
  refinedContent: string;
}

export async function refineGeneratedContent(
  request: ContentRefinementRequest
): Promise<ContentRefinementResponse> {
  const { originalContent, feedback, tone, persona } = request;

  // Mock content refinement - in a real implementation, this would call an AI service
  let refinedContent = originalContent;

  // Apply common refinements based on feedback keywords
  if (feedback.toLowerCase().includes('shorter') || feedback.toLowerCase().includes('concise')) {
    refinedContent = makeContentShorter(originalContent);
  } else if (feedback.toLowerCase().includes('longer') || feedback.toLowerCase().includes('detailed')) {
    refinedContent = makeContentLonger(originalContent, tone);
  } else if (feedback.toLowerCase().includes('casual') || feedback.toLowerCase().includes('friendly')) {
    refinedContent = makeCasual(originalContent);
  } else if (feedback.toLowerCase().includes('professional') || feedback.toLowerCase().includes('formal')) {
    refinedContent = makeProfessional(originalContent);
  } else if (feedback.toLowerCase().includes('engaging') || feedback.toLowerCase().includes('exciting')) {
    refinedContent = makeEngaging(originalContent);
  } else {
    // General refinement based on feedback
    refinedContent = applyGeneralFeedback(originalContent, feedback, tone, persona);
  }

  return { refinedContent };
}

function makeContentShorter(content: string): string {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Keep main message and key points, remove extra details
  const mainLines = lines.slice(0, Math.ceil(lines.length * 0.7));
  
  return mainLines.join('\n');
}

function makeContentLonger(content: string, tone: string): string {
  const additions = tone.toLowerCase() === 'professional' 
    ? [
        '',
        'Key benefits include:',
        '• Improved efficiency and results',
        '• Better alignment with business goals', 
        '• Enhanced customer satisfaction',
        '',
        'What strategies have worked best for your team?'
      ]
    : [
        '',
        'Here are some additional thoughts:',
        '',
        '💡 This approach has helped many businesses',
        '🚀 The results speak for themselves',
        '✨ Small changes can make a big difference',
        '',
        'What\'s your take on this? Let me know! 👇'
      ];

  return content + '\n' + additions.join('\n');
}

function makeCasual(content: string): string {
  return content
    .replace(/\bWe believe\b/g, 'We think')
    .replace(/\bHowever,\b/g, 'But')
    .replace(/\bFurthermore,\b/g, 'Plus')
    .replace(/\bIn conclusion,\b/g, 'So')
    .replace(/\bUtilize\b/g, 'Use')
    .replace(/\bImplement\b/g, 'Try')
    .replace(/\bOptimize\b/g, 'Improve')
    .replace(/\. /g, '! ')
    .replace(/What are your thoughts\?/g, 'What do you think? 🤔')
    .replace(/#Business/g, '#Business #Casual');
}

function makeProfessional(content: string): string {
  return content
    .replace(/\bthink\b/g, 'believe')
    .replace(/\bBut\b/g, 'However,')
    .replace(/\bPlus\b/g, 'Furthermore,')
    .replace(/\bSo\b/g, 'In conclusion,')
    .replace(/\bUse\b/g, 'Utilize')
    .replace(/\bTry\b/g, 'Implement')
    .replace(/\bImprove\b/g, 'Optimize')
    .replace(/! /g, '. ')
    .replace(/🤔/g, '')
    .replace(/#Casual/g, '#Professional');
}

function makeEngaging(content: string): string {
  const engagingElements = [
    '🔥', '💡', '✨', '🚀', '💪', '👇', '🎯', '⚡'
  ];
  
  let engaging = content;
  
  // Add emojis to key points
  engaging = engaging.replace(/^•/gm, '✨');
  engaging = engaging.replace(/^→/gm, '🚀');
  
  // Make questions more engaging
  engaging = engaging.replace(/What do you think\?/g, 'What do you think? Drop your thoughts below! 👇');
  engaging = engaging.replace(/Share your thoughts/g, 'I\'d love to hear your thoughts');
  
  // Add call-to-action
  if (!engaging.includes('👇') && !engaging.includes('comment')) {
    engaging += '\n\nWhat\'s your experience with this? Share in the comments! 💬';
  }
  
  return engaging;
}

function applyGeneralFeedback(content: string, feedback: string, tone: string, persona: string): string {
  // This is a simplified version - in a real implementation, 
  // this would use AI to understand and apply the feedback
  
  let refined = content;
  
  // Add a note about the refinement
  const refinementNote = `\n\n[Refined based on: "${feedback}"]`;
  
  // Apply tone adjustments
  if (tone.toLowerCase() === 'casual') {
    refined = makeCasual(refined);
  } else if (tone.toLowerCase() === 'professional') {
    refined = makeProfessional(refined);
  }
  
  // Apply persona adjustments
  if (persona.toLowerCase().includes('expert')) {
    refined = refined.replace(/I think/g, 'In my experience');
    refined = refined.replace(/Maybe/g, 'Based on industry best practices');
  }
  
  return refined + refinementNote;
}