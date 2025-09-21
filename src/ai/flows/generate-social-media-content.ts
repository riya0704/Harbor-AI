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
  text: z.string().optional().describe('The generated text content for a text-only post.'),
  imageCaption: z
    .string()
    .optional()
    .describe('The caption for the generated image.'),
  imagePrompt: z
    .string()
    .optional()
    .describe('A short, descriptive prompt for an image generation model.'),
  imageUrl: z.string().optional().describe('The URL of the generated image as a data URI.'),
  videoCaption: z.string().optional().describe('The caption for the generated video.'),
  videoUrl: z.string().optional().describe('The URL of the generated video.'),
});

export type GenerateSocialMediaContentOutput = z.infer<
  typeof GenerateSocialMediaContentOutputSchema
>;

export async function generateSocialMediaContent(
  input: GenerateSocialMediaContentInput
): Promise<GenerateSocialMediaContentOutput> {
  return generateSocialMediaContentFlow(input);
}

const textGenerationPrompt = ai.definePrompt({
  name: 'textGenerationPrompt',
  input: {schema: GenerateSocialMediaContentInputSchema},
  output: {
    schema: z.object({
      text: z.string().describe('The generated text content for a text-only post.'),
    }),
  },
  prompt: `You are a social media expert. Your task is to expand the following content idea into a full social media post.

Content Idea: "{{{suggestion}}}"

Take this idea and generate an engaging text-only social media post based on the provided business details and desired tone, style, and persona.

Business Details: {{{businessDetails}}}
Tone: {{{tone}}}
Style: {{{style}}}
Persona: {{{persona}}}

Ensure that the content is creative, engaging, and doesn't sound too AI-generated.
`,
});

const imageGenerationPrompt = ai.definePrompt({
  name: 'imageGenerationPrompt',
  input: {schema: GenerateSocialMediaContentInputSchema},
  output: {
    schema: z.object({
      imageCaption: z.string().describe('The caption for the generated image.'),
      imagePrompt: z
        .string()
        .describe(
          'A short, descriptive prompt for an image generation model. This should be a single sentence describing the visual content.'
        ),
    }),
  },
  prompt: `You are a social media expert. Your task is to generate a caption and an image prompt for a social media post based on a content idea.

Content Idea: "{{{suggestion}}}"

Based on the idea, business details, and desired tone/style/persona, generate:
1. An engaging and creative caption for the image.
2. A concise, descriptive prompt (1-2 sentences) to be used with an AI image generation model to create a visually appealing image that matches the caption.

Business Details: {{{businessDetails}}}
Tone: {{{tone}}}
Style: {{{style}}}
Persona: {{{persona}}}

Ensure the caption is engaging and the image prompt is specific enough to generate a high-quality image.
`,
});

const generateSocialMediaContentFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaContentFlow',
    inputSchema: GenerateSocialMediaContentInputSchema,
    outputSchema: GenerateSocialMediaContentOutputSchema,
  },
  async input => {
    if (input.contentType === 'text') {
      const {output} = await textGenerationPrompt(input);
      return output!;
    }

    if (input.contentType === 'image') {
      // 1. Generate caption and image prompt
      const {output: imageDetails} = await imageGenerationPrompt(input);
      if (!imageDetails?.imagePrompt) {
        throw new Error('Failed to generate image details.');
      }

      // 2. Generate image
      const {media} = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: imageDetails.imagePrompt,
      });

      return {
        imageCaption: imageDetails.imageCaption,
        imagePrompt: imageDetails.imagePrompt,
        imageUrl: media.url,
      };
    }

    if (input.contentType === 'video') {
      // Placeholder for video generation
      return {
        videoCaption: `A great video about: ${input.suggestion}`,
        videoUrl: 'https://placehold.co/1080x1920.mp4?text=Sample+Video',
      };
    }

    return {};
  }
);
