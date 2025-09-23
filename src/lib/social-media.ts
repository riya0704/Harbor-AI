import axios from 'axios';
import crypto from 'crypto';
import { SocialPlatform } from './types';
import SocialAccountModel, { SocialAccountDocument } from '@/models/SocialAccount';
import CacheService, { CacheKeys } from './cache';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export interface PublishResult {
  success: boolean;
  publishedId?: string;
  error?: string;
  publishedAt?: Date;
}

export interface PostContent {
  text: string;
  image?: string;
  video?: string;
}

export class SocialMediaService {
  private static instance: SocialMediaService;
  private cache: CacheService;

  public static getInstance(): SocialMediaService {
    if (!SocialMediaService.instance) {
      SocialMediaService.instance = new SocialMediaService();
    }
    return SocialMediaService.instance;
  }

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Get OAuth configuration for a platform
   */
  private getOAuthConfig(platform: SocialPlatform): OAuthConfig {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    switch (platform) {
      case 'Twitter':
        return {
          clientId: process.env.TWITTER_CLIENT_ID!,
          clientSecret: process.env.TWITTER_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/auth/callback/twitter`,
          scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
        };
      
      case 'LinkedIn':
        return {
          clientId: process.env.LINKEDIN_CLIENT_ID!,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/auth/callback/linkedin`,
          scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
        };
      
      case 'Instagram':
        return {
          clientId: process.env.INSTAGRAM_CLIENT_ID!,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/auth/callback/instagram`,
          scopes: ['user_profile', 'user_media']
        };
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Generate PKCE challenge for OAuth 2.0
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }

  /**
   * Initiate OAuth flow for a platform
   */
  async initiateOAuth(platform: SocialPlatform, userId: string): Promise<string> {
    const config = this.getOAuthConfig(platform);
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state and user ID for verification
    await this.cache.set(`oauth:state:${state}`, { userId, platform }, 600); // 10 minutes

    let authUrl: string;

    switch (platform) {
      case 'Twitter':
        const { codeVerifier, codeChallenge } = this.generatePKCE();
        
        // Store code verifier for later use
        await this.cache.set(`oauth:verifier:${state}`, codeVerifier, 600);
        
        authUrl = `https://twitter.com/i/oauth2/authorize?` +
          `response_type=code&` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `scope=${encodeURIComponent(config.scopes.join(' '))}&` +
          `state=${state}&` +
          `code_challenge=${codeChallenge}&` +
          `code_challenge_method=S256`;
        break;

      case 'LinkedIn':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
          `response_type=code&` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `scope=${encodeURIComponent(config.scopes.join(' '))}&` +
          `state=${state}`;
        break;

      case 'Instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `scope=${encodeURIComponent(config.scopes.join(','))}&` +
          `response_type=code&` +
          `state=${state}`;
        break;

      default:
        throw new Error(`OAuth not implemented for ${platform}`);
    }

    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(
    platform: SocialPlatform,
    code: string,
    state: string
  ): Promise<SocialAccountDocument> {
    // Verify state
    const stateData = await this.cache.get<{ userId: string; platform: SocialPlatform }>(`oauth:state:${state}`);
    
    if (!stateData || stateData.platform !== platform) {
      throw new Error('Invalid OAuth state');
    }

    const config = this.getOAuthConfig(platform);
    let tokenResponse: TokenResponse;

    switch (platform) {
      case 'Twitter':
        tokenResponse = await this.exchangeTwitterCode(code, state, config);
        break;
      
      case 'LinkedIn':
        tokenResponse = await this.exchangeLinkedInCode(code, config);
        break;
      
      case 'Instagram':
        tokenResponse = await this.exchangeInstagramCode(code, config);
        break;
      
      default:
        throw new Error(`Token exchange not implemented for ${platform}`);
    }

    // Get user profile information
    const profileData = await this.getUserProfile(platform, tokenResponse.access_token);

    // Save or update social account
    const existingAccount = await SocialAccountModel.findOne({
      userId: stateData.userId,
      platform: platform
    });

    let socialAccount: SocialAccountDocument;

    if (existingAccount) {
      // Update existing account
      existingAccount.username = profileData.username;
      existingAccount.avatarUrl = profileData.avatarUrl;
      existingAccount.accessToken = tokenResponse.access_token;
      existingAccount.refreshToken = tokenResponse.refresh_token;
      
      if (tokenResponse.expires_in) {
        existingAccount.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      }
      
      socialAccount = await existingAccount.save();
    } else {
      // Create new account
      socialAccount = new SocialAccountModel({
        userId: stateData.userId,
        platform: platform,
        username: profileData.username,
        avatarUrl: profileData.avatarUrl,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000)
          : undefined
      });
      
      await socialAccount.save();
    }

    // Cache the token
    await this.cache.set(
      CacheKeys.socialToken(stateData.userId, platform),
      tokenResponse.access_token,
      tokenResponse.expires_in || 3600
    );

    // Clean up OAuth state
    await this.cache.delete(`oauth:state:${state}`);
    await this.cache.delete(`oauth:verifier:${state}`);

    return socialAccount;
  }

  /**
   * Exchange Twitter authorization code for tokens
   */
  private async exchangeTwitterCode(code: string, state: string, config: OAuthConfig): Promise<TokenResponse> {
    const codeVerifier = await this.cache.get<string>(`oauth:verifier:${state}`);
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
        }
      }
    );

    return response.data;
  }

  /**
   * Exchange LinkedIn authorization code for tokens
   */
  private async exchangeLinkedInCode(code: string, config: OAuthConfig): Promise<TokenResponse> {
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  }

  /**
   * Exchange Instagram authorization code for tokens
   */
  private async exchangeInstagramCode(code: string, config: OAuthConfig): Promise<TokenResponse> {
    const response = await axios.post('https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  }

  /**
   * Get user profile information from platform
   */
  private async getUserProfile(platform: SocialPlatform, accessToken: string): Promise<{
    username: string;
    avatarUrl: string;
  }> {
    switch (platform) {
      case 'Twitter':
        const twitterResponse = await axios.get('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        return {
          username: twitterResponse.data.data.username,
          avatarUrl: twitterResponse.data.data.profile_image_url || ''
        };

      case 'LinkedIn':
        const linkedinResponse = await axios.get('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const profile = linkedinResponse.data;
        const firstName = profile.firstName?.localized?.en_US || '';
        const lastName = profile.lastName?.localized?.en_US || '';
        const avatarUrl = profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || '';
        
        return {
          username: `${firstName} ${lastName}`.trim(),
          avatarUrl
        };

      case 'Instagram':
        const instagramResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
        
        return {
          username: instagramResponse.data.username,
          avatarUrl: '' // Instagram Basic Display API doesn't provide profile pictures
        };

      default:
        throw new Error(`Profile fetch not implemented for ${platform}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(accountId: string): Promise<void> {
    const account = await SocialAccountModel.findById(accountId);
    
    if (!account || !account.refreshToken) {
      throw new Error('Account or refresh token not found');
    }

    const config = this.getOAuthConfig(account.platform);
    let tokenResponse: TokenResponse;

    switch (account.platform) {
      case 'Twitter':
        tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token',
          new URLSearchParams({
            refresh_token: account.refreshToken,
            grant_type: 'refresh_token',
            client_id: config.clientId
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
            }
          }
        ).then(res => res.data);
        break;

      case 'LinkedIn':
        // LinkedIn tokens are long-lived (60 days), refresh not typically needed
        throw new Error('LinkedIn token refresh not required');

      case 'Instagram':
        // Instagram Basic Display API tokens can be refreshed
        tokenResponse = await axios.get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.refreshToken}`)
          .then(res => res.data);
        break;

      default:
        throw new Error(`Token refresh not implemented for ${account.platform}`);
    }

    // Update account with new tokens
    account.accessToken = tokenResponse.access_token;
    if (tokenResponse.refresh_token) {
      account.refreshToken = tokenResponse.refresh_token;
    }
    if (tokenResponse.expires_in) {
      account.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    }

    await account.save();

    // Update cache
    await this.cache.set(
      CacheKeys.socialToken(account.userId.toString(), account.platform),
      tokenResponse.access_token,
      tokenResponse.expires_in || 3600
    );
  }

  /**
   * Verify connection to social media platform
   */
  async verifyConnection(accountId: string): Promise<boolean> {
    try {
      const account = await SocialAccountModel.findById(accountId);
      
      if (!account) {
        return false;
      }

      // Check if token is expired
      if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
        try {
          await this.refreshToken(accountId);
        } catch (error) {
          return false;
        }
      }

      // Test API call to verify connection
      await this.getUserProfile(account.platform, account.accessToken!);
      return true;
    } catch (error) {
      console.error('Connection verification failed:', error);
      return false;
    }
  }

  /**
   * Disconnect social media account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    const account = await SocialAccountModel.findById(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    // Remove from cache
    await this.cache.delete(CacheKeys.socialToken(account.userId.toString(), account.platform));

    // Delete from database
    await SocialAccountModel.findByIdAndDelete(accountId);
  }

  /**
   * Get cached access token
   */
  async getAccessToken(userId: string, platform: SocialPlatform): Promise<string | null> {
    // Try cache first
    const cachedToken = await this.cache.get<string>(CacheKeys.socialToken(userId, platform));
    
    if (cachedToken) {
      return cachedToken;
    }

    // Fallback to database
    const account = await SocialAccountModel.findOne({ userId, platform });
    
    if (!account || !account.accessToken) {
      return null;
    }

    // Check if token is expired
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      try {
        await this.refreshToken(account.id);
        return account.accessToken;
      } catch (error) {
        return null;
      }
    }

    // Cache the token
    const ttl = account.tokenExpiresAt 
      ? Math.floor((account.tokenExpiresAt.getTime() - Date.now()) / 1000)
      : 3600;
    
    await this.cache.set(CacheKeys.socialToken(userId, platform), account.accessToken, ttl);

    return account.accessToken;
  }
}

export default SocialMediaService.getInstance();