import { config } from 'dotenv';
config();

import '@/ai/flows/get-content-suggestions.ts';
import '@/ai/flows/generate-social-media-content.ts';
import '@/ai/flows/refine-generated-content.ts';