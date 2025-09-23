export type SocialPlatform = "Twitter" | "LinkedIn" | "Instagram";

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  username: string;
  avatarUrl: string;
};

export type PostStatus = "draft" | "scheduled" | "published" | "error";

export type PostType = "dynamic" | "static";

export type Post = {
  id: string;
  date: Date;
  platforms: SocialPlatform[];
  content: string;
  image?: string;
  video?: string;
  status: PostStatus;
  type: PostType;
  userId: string;
};

export type BusinessContext = {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  keyTopics: string[];
  contentPreferences: {
    tone: string;
    style: string;
    persona: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ChatSession = {
  id: string;
  userId: string;
  messages: ChatMessage[];
  businessContextId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ScheduledPost = {
  id: string;
  userId: string;
  postId: string;
  scheduledTime: Date;
  platforms: SocialPlatform[];
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  publishResults: PublishResult[];
  retryCount: number;
  createdAt: Date;
};

export type PublishResult = {
  platform: SocialPlatform;
  success: boolean;
  publishedId?: string;
  error?: string;
  publishedAt?: Date;
};

export type ContentType = 'text' | 'image' | 'video';

export type GeneratedContent = {
  text?: string;
  imageCaption?: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoCaption?: string;
  videoUrl?: string;
};

export type ContentType = 'text' | 'image' | 'video';
