'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized social media content.
 *
 * The flow takes user input about their business and generates content (text, image + caption, video + caption) for social media posts.
 * It exports:
 * - `generateSocialMediaContent`: The main function to trigger the content generation flow.
 * - `GenerateSocialMediaContentInput`: The input type for the `generateSocialMediaContent` function.
 * - `GenerateSocialMediaContentOutput`: The output type for the `generateSocialMediaContent` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaContentInputSchema = z.object({
  businessDetails: z
    .string()
    .describe('Details about the business or topic for which content is to be generated.'),
  contentType: z.enum(['text', 'image', 'video']).describe('The type of content to generate.'),
  suggestion: z.string().describe('The user selected suggestion to expand upon.'),
  tone: z
    .string()
    .optional()
    .describe('The desired tone of the content (e.g., professional, funny, informative).'),
  style: z
    .string()
    .optional()
    .describe('The desired style of the content (e.g., minimalist, vibrant, corporate).'),
  persona: z
    .string()
    .optional()
    .describe('The persona to use when generating the content. Ex. "youthful", "expert", etc.'),
});

export type GenerateSocialMediaContentInput = z.infer<
  typeof GenerateSocialMediaContentInputSchema
>;

const GenerateSocialMediaContentOutputSchema = z.object({
  text: z.string().optional().describe('The generated text content.'),
  imageUrl: z.string().optional().describe('The URL of the generated image.'),
  imageCaption: z.string().optional().describe('The caption for the generated image.'),
  videoUrl: z.string().optional().describe('The URL of the generated video.'),
  videoCaption: z.string().optional().describe('The caption for the generated video.'),
});

export type GenerateSocialMediaContentOutput = z.infer<
  typeof GenerateSocialMediaContentOutputSchema
>;

export async function generateSocialMediaContent(
  input: GenerateSocialMediaContentInput
): Promise<GenerateSocialMediaContentOutput> {
  return generateSocialMediaContentFlow(input);
}

const generateSocialMediaContentPrompt = ai.definePrompt({
  name: 'generateSocialMediaContentPrompt',
  input: {schema: GenerateSocialMediaContentInputSchema},
  output: {schema: GenerateSocialMediaContentOutputSchema},
  prompt: `You are a social media expert. Your task is to expand the following content idea into a full social media post.

Content Idea: "{{{suggestion}}}"

Take this idea and generate an engaging social media post based on the provided business details, content type, and desired tone and style.

Business Details: {{{businessDetails}}}
Content Type: {{{contentType}}}
Tone: {{{tone}}}
Style: {{{style}}}
Persona: {{{persona}}}

If the content type is 'text', generate a text post.
If the content type is 'image', generate a URL for an image and a caption.
If the content type is 'video', generate a URL for a video and a caption.

Ensure that the content is creative, engaging, and doesn't sound too AI-generated. It should reflect the specified tone, style, and persona.
`,
});

const generateSocialMediaContentFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaContentFlow',
    inputSchema: GenerateSocialMediaContentInputSchema,
    outputSchema: GenerateSocialMediaContentOutputSchema,
  },
  async input => {
    const {output} = await generateSocialMediaContentPrompt(input);
    return output!;
  }
);
