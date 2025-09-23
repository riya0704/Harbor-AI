interface ContentSuggestionsRequest {
  businessDetails: string;
  socialMediaPlatform: string;
  contentGoal: string;
  personaTraits: string;
}

interface ContentSuggestionsResponse {
  suggestions: string[];
}

export async function getContentSuggestions(
  request: ContentSuggestionsRequest
): Promise<ContentSuggestionsResponse> {
  const { businessDetails, socialMediaPlatform, contentGoal, personaTraits } = request;

  // Mock AI suggestions for now - in a real implementation, this would call an AI service
  const suggestions = [
    `Share insights about ${contentGoal} relevant to your ${businessDetails.split('\n')[1]?.replace('Industry: ', '') || 'industry'}`,
    `Create engaging ${socialMediaPlatform} content about ${contentGoal} with ${personaTraits} tone`,
    `Discuss trends in ${contentGoal} that your audience would find valuable`,
    `Share a personal story or case study related to ${contentGoal}`,
    `Ask your audience a thought-provoking question about ${contentGoal}`
  ];

  return { suggestions };
}