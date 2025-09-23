interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BusinessContext {
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  brandVoice?: string;
  keyTopics?: string[];
  contentPreferences?: {
    tone: string;
    style: string;
    persona: string;
  };
}

interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
  currentContext?: BusinessContext;
}

interface ChatResponse {
  response: string;
  isComplete: boolean;
  nextQuestion?: string;
  extractedContext?: Partial<BusinessContext>;
}

export async function businessContextChat(request: ChatRequest): Promise<ChatResponse> {
  const { message, chatHistory, currentContext } = request;

  // Mock AI chat response - in a real implementation, this would call an AI service
  const extractedContext: Partial<BusinessContext> = {};
  let response = '';
  let isComplete = false;
  let nextQuestion: string | undefined;

  // Simple keyword extraction for business context
  const lowerMessage = message.toLowerCase();

  // Extract business name
  if (lowerMessage.includes('my business is') || lowerMessage.includes('company is') || lowerMessage.includes('we are')) {
    const businessMatch = message.match(/(?:my business is|company is|we are)\s+([^.!?]+)/i);
    if (businessMatch) {
      extractedContext.businessName = businessMatch[1].trim();
    }
  }

  // Extract industry
  if (lowerMessage.includes('industry') || lowerMessage.includes('sector') || lowerMessage.includes('field')) {
    const industryKeywords = ['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'consulting', 'marketing', 'real estate', 'food', 'travel', 'fitness', 'beauty', 'automotive'];
    for (const keyword of industryKeywords) {
      if (lowerMessage.includes(keyword)) {
        extractedContext.industry = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
  }

  // Extract target audience
  if (lowerMessage.includes('target') || lowerMessage.includes('audience') || lowerMessage.includes('customers')) {
    const audienceMatch = message.match(/(?:target|audience|customers?)(?:\s+(?:is|are))?\s+([^.!?]+)/i);
    if (audienceMatch) {
      extractedContext.targetAudience = audienceMatch[1].trim();
    }
  }

  // Generate appropriate response based on context completeness
  const hasBusinessName = currentContext?.businessName || extractedContext.businessName;
  const hasIndustry = currentContext?.industry || extractedContext.industry;
  const hasTargetAudience = currentContext?.targetAudience || extractedContext.targetAudience;
  const hasBrandVoice = currentContext?.brandVoice || extractedContext.brandVoice;

  if (!hasBusinessName) {
    response = "Hi there! I'd love to help you create amazing content. Let's start with the basics - what's your business name and what do you do?";
    nextQuestion = "What's your business name and what industry are you in?";
  } else if (!hasIndustry) {
    response = `Great to meet you, ${hasBusinessName}! To create the most relevant content for you, could you tell me more about your industry or the specific field you work in?`;
    nextQuestion = "What industry or field does your business operate in?";
  } else if (!hasTargetAudience) {
    response = `Perfect! ${hasBusinessName} in the ${hasIndustry} industry. Now, who is your ideal customer or target audience? Understanding who you're trying to reach will help me create content that resonates with them.`;
    nextQuestion = "Who is your target audience or ideal customer?";
  } else if (!hasBrandVoice) {
    response = `Excellent! So ${hasBusinessName} serves ${hasTargetAudience} in the ${hasIndustry} space. One last key question - how would you describe your brand voice? Are you more professional and authoritative, friendly and casual, or something else?`;
    nextQuestion = "How would you describe your brand voice and communication style?";
  } else {
    response = `Perfect! I now have a good understanding of ${hasBusinessName}. You're in ${hasIndustry}, targeting ${hasTargetAudience}, with a ${hasBrandVoice} brand voice. I'm ready to help you create engaging content! What type of content would you like to work on today?`;
    isComplete = true;
  }

  // Handle specific questions or requests
  if (lowerMessage.includes('content') && lowerMessage.includes('help')) {
    response = "I can help you create various types of content! I can generate social media posts, blog ideas, marketing copy, and more. What specific type of content are you looking to create?";
  } else if (lowerMessage.includes('social media')) {
    response = "Great choice! Social media content is one of my specialties. I can help you create posts for Twitter, LinkedIn, Instagram, and other platforms. What platform are you focusing on, and what's your main goal with the content?";
  } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    response = "You're very welcome! I'm here to help you create amazing content whenever you need it. Feel free to ask me anything about content creation, social media strategy, or marketing ideas!";
  }

  return {
    response,
    isComplete,
    nextQuestion,
    extractedContext: Object.keys(extractedContext).length > 0 ? extractedContext : undefined
  };
}