import axios from 'axios';
import { SocialPlatform } from './types';
import SocialMediaService from './social-media';

export interface PostContent {
  text: string;
  image?: string;
  video?: string;
}

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  publishedId?: string;
  error?: string;
  publishedAt?: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class PublisherService {
  private static instance: PublisherService;
  private socialMediaService: SocialMediaService;

  public static getInstance(): PublisherService {
    if (!PublisherService.instance) {
      PublisherService.instance = new PublisherService();
    }
    return PublisherService.instance;
  }

  constructor() {
    this.socialMediaService = SocialMediaService.getInstance();
  }

  /**
   * Validate content for a specific platform
   */
  validateContent(platform: SocialPlatform, content: PostContent): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    switch (platform) {
      case 'Twitter':
        // Twitter character limit
        if (content.text.length > 280) {
          result.valid = false;
          result.errors.push(`Text exceeds Twitter's 280 character limit (${content.text.length} characters)`);
        }
        
        // Check for both image and video
        if (content.image && content.video) {
          result.valid = false;
          result.errors.push('Twitter posts cannot contain both image and video');
        }
        
        // Warn about optimal length
        if (content.text.length > 240) {
          result.warnings.push('Consider shortening text for better engagement');
        }
        break;

      case 'LinkedIn':
        // LinkedIn character limit for posts
        if (content.text.length > 3000) {
          result.valid = false;
          result.errors.push(`Text exceeds LinkedIn's 3000 character limit (${content.text.length} characters)`);
        }
        
        // Optimal length warning
        if (content.text.length > 1300) {
          result.warnings.push('Posts over 1300 characters may be truncated in feed');
        }
        break;

      case 'Instagram':
        // Instagram caption limit
        if (content.text.length > 2200) {
          result.valid = false;
          result.errors.push(`Caption exceeds Instagram's 2200 character limit (${content.text.length} characters)`);
        }
        
        // Instagram requires media
        if (!content.image && !content.video) {
          result.valid = false;
          result.errors.push('Instagram posts require either an image or video');
        }
        break;
    }

    return result;
  }

  /**
   * Publish content to a specific platform
   */
  async publishPost(
    userId: string,
    platform: SocialPlatform,
    content: PostContent
  ): Promise<PublishResult> {
    try {
      // Validate content first
      const validation = this.validateContent(platform, content);
      if (!validation.valid) {
        return {
          platform,
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          publishedAt: new Date()
        };
      }

      // Get access token
      const accessToken = await this.socialMediaService.getAccessToken(userId, platform);
      if (!accessToken) {
        return {
          platform,
          success: false,
          error: 'No valid access token found. Please reconnect your account.',
          publishedAt: new Date()
        };
      }

      // Publish to platform
      let publishedId: string;

      switch (platform) {
        case 'Twitter':
          publishedId = await this.publishToTwitter(accessToken, content);
          break;
        
        case 'LinkedIn':
          publishedId = await this.publishToLinkedIn(accessToken, content);
          break;
        
        case 'Instagram':
          publishedId = await this.publishToInstagram(accessToken, content);
          break;
        
        default:
          throw new Error(`Publishing not implemented for ${platform}`);
      }

      return {
        platform,
        success: true,
        publishedId,
        publishedAt: new Date()
      };

    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      
      return {
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        publishedAt: new Date()
      };
    }
  }

  /**
   * Publish to Twitter using API v2
   */
  private async publishToTwitter(accessToken: string, content: PostContent): Promise<string> {
    const tweetData: any = {
      text: content.text
    };

    // Handle media upload if present
    if (content.image || content.video) {
      // Note: This is a simplified version. In production, you'd need to:
      // 1. Upload media to Twitter's media endpoint first
      // 2. Get media_id from upload response
      // 3. Attach media_id to tweet
      
      // For now, we'll just include the media URL in the text if it's a URL
      if (content.image && content.image.startsWith('http')) {
        tweetData.text += ` ${content.image}`;
      }
    }

    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      tweetData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.id;
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(accessToken: string, content: PostContent): Promise<string> {
    // First, get the user's LinkedIn ID
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/people/~:(id)',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const personId = profileResponse.data.id;

    const shareData: any = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Handle media if present
    if (content.image || content.video) {
      // Note: LinkedIn media upload is complex and requires multiple API calls
      // This is a simplified version for demonstration
      shareData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      shareData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(accessToken: string, content: PostContent): Promise<string> {
    // Note: Instagram publishing requires Instagram Business Account
    // and is more complex than other platforms
    
    if (!content.image && !content.video) {
      throw new Error('Instagram posts require media');
    }

    // This is a simplified version. In production, you'd need to:
    // 1. Upload media to Instagram
    // 2. Create media container
    // 3. Publish the container

    // For now, we'll simulate the process
    const mediaUrl = content.image || content.video;
    
    if (!mediaUrl || !mediaUrl.startsWith('http')) {
      throw new Error('Instagram requires a valid media URL');
    }

    // Simulate Instagram API call
    // In reality, this would involve multiple API calls to Instagram Graph API
    const mockResponse = {
      id: `instagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return mockResponse.id;
  }

  /**
   * Publish to multiple platforms
   */
  async publishToMultiplePlatforms(
    userId: string,
    platforms: SocialPlatform[],
    content: PostContent
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    // Publish to each platform concurrently
    const publishPromises = platforms.map(platform =>
      this.publishPost(userId, platform, content)
    );

    const publishResults = await Promise.allSettled(publishPromises);

    publishResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          platform: platforms[index],
          success: false,
          error: result.reason?.message || 'Unknown error',
          publishedAt: new Date()
        });
      }
    });

    return results;
  }

  /**
   * Get platform-specific posting guidelines
   */
  getPostingGuidelines(platform: SocialPlatform): {
    maxTextLength: number;
    supportsImages: boolean;
    supportsVideos: boolean;
    requiresMedia: boolean;
    bestPractices: string[];
  } {
    switch (platform) {
      case 'Twitter':
        return {
          maxTextLength: 280,
          supportsImages: true,
          supportsVideos: true,
          requiresMedia: false,
          bestPractices: [
            'Keep tweets concise and engaging',
            'Use hashtags strategically (1-2 per tweet)',
            'Include calls to action',
            'Post during peak hours (9-10 AM, 7-9 PM)',
            'Use threads for longer content'
          ]
        };

      case 'LinkedIn':
        return {
          maxTextLength: 3000,
          supportsImages: true,
          supportsVideos: true,
          requiresMedia: false,
          bestPractices: [
            'Share professional insights and experiences',
            'Use industry-relevant hashtags',
            'Engage with comments promptly',
            'Post during business hours (8 AM - 6 PM)',
            'Include questions to encourage engagement'
          ]
        };

      case 'Instagram':
        return {
          maxTextLength: 2200,
          supportsImages: true,
          supportsVideos: true,
          requiresMedia: true,
          bestPractices: [
            'Use high-quality, visually appealing images',
            'Write engaging captions with storytelling',
            'Use relevant hashtags (5-10 per post)',
            'Post consistently (1-2 times per day)',
            'Engage with your audience through comments and stories'
          ]
        };

      default:
        throw new Error(`Guidelines not available for ${platform}`);
    }
  }
}

export default PublisherService.getInstance();