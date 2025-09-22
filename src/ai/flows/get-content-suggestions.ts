'use server';

/**
 * @fileOverview A content suggestion AI agent.
 *
 * - getContentSuggestions - A function that handles the content suggestion process.
 * - GetContentSuggestionsInput - The input type for the getContentSuggestions function.
 * - GetContentSuggestionsOutput - The return type for the getContentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetContentSuggestionsInputSchema = z.object({
  businessDetails: z
    .string()
    .describe('Details about the business for which content is being generated.'),
  socialMediaPlatform: z
    .string()
    .describe('The social media platform for which content is being generated (e.g., Twitter, LinkedIn, Instagram).'),
  contentGoal: z
    .string()
    .describe('The goal of the content (e.g., increase engagement, promote a product, share news).'),
  personaTraits: z
    .string()
    .describe('Traits that should be used to modulate the AI persona to prevent the output from appearing too AI generated. (e.g., humor, technical, friendly).'),
});
export type GetContentSuggestionsInput = z.infer<typeof GetContentSuggestionsInputSchema>;

const GetContentSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of content suggestions.'),
});
export type GetContentSuggestionsOutput = z.infer<typeof GetContentSuggestionsOutputSchema>;

export async function getContentSuggestions(input: GetContentSuggestionsInput): Promise<GetContentSuggestionsOutput> {
  return getContentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getContentSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GetContentSuggestionsInputSchema},
  output: {schema: GetContentSuggestionsOutputSchema},
  prompt: `You are a social media expert helping businesses create engaging content.

  Based on the business details, social media platform, and content goal, generate a list of content suggestions.
  The goal of the content is {{{contentGoal}}}.
  Here are the business details: {{{businessDetails}}}.
  The social media platform is {{{socialMediaPlatform}}}.
  Incorporate the following persona traits into the suggestion to avoid appearing too AI generated: {{{personaTraits}}}

  Please provide a list of content suggestions that are tailored to the business and platform.
  Each suggestion should be less than 280 characters.

  Content Suggestions:`,
});

const getContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'getContentSuggestionsFlow',
    inputSchema: GetContentSuggestionsInputSchema,
    outputSchema: GetContentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
