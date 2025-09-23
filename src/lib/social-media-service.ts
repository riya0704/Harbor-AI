import { SocialPlatform, SocialAccount } from './types';
import SocialAccountModel from '@/models/SocialAccount';
import { cacheService } from './cache';
import clientPromise from './mongodb';
import crypto from 'crypto';

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

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export class SocialMediaService {
  private static instance: SocialMediaService;

  public static getInstance(): SocialMediaService {
    if (!SocialMediaService.instance) {
      SocialMediaService.instance = new SocialMediaService();
    }
    return SocialMediaService.instance;
  }

  // OAuth Configuration
  private getOAuthConfig(platform: SocialPlatform): OAuthConfig {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    switch (platform) {
      case 'Twitter':
        return {
          clientId: process.env.TWITTER_CLIENT_ID!,
          clientSecret: process.env.TWITTER_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/social/oauth/twitter/callback`,
          scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
        };
      case 'LinkedIn':
        return {
          clientId: process.env.LINKEDIN_CLIENT_ID!,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/social/oauth/linkedin/callback`,
          scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
        };
      case 'Instagram':
        return {
          clientId: process.env.INSTAGRAM_CLIENT_ID!,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
          redirectUri: `${baseUrl}/api/social/oauth/instagram/callback`,
          scopes: ['user_profile', 'user_media']
        };
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // OAuth Flow Initiation
  async initiateOAuth(platform: SocialPlatform, userId: string): Promise<string> {
    const config = this.getOAuthConfig(platform);
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state for verification
    await cacheService.set(`oauth_state:${state}`, { userId, platform }, 600); // 10 minutes

    switch (platform) {
      case 'Twitter':
        return this.initiateTwitterOAuth(config, state);
      case 'LinkedIn':
        return this.initiateLinkedInOAuth(config, state);
      case 'Instagram':
        return this.initiateInstagramOAuth(config, state);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private initiateTwitterOAuth(config: OAuthConfig, state: string): string {
    const codeChallenge = crypto.randomBytes(32).toString('base64url');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'plain'
    });

    // Store code challenge for later verification
    cacheService.set(`twitter_challenge:${state}`, codeChallenge, 600);

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  private initiateLinkedInOAuth(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  private initiateInstagramOAuth(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(','),
      response_type: 'code',
      state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  // OAuth Callback Handling
  async handleOAuthCallback(platform: SocialPlatform, code: string, state: string): Promise<SocialAccount> {
    // Verify state
    const stateData = await cacheService.get<{ userId: string; platform: SocialPlatform }>(`oauth_state:${state}`);
    if (!stateData || stateData.platform !== platform) {
      throw new Error('Invalid OAuth state');
    }

    const config = this.getOAuthConfig(platform);
    
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(platform, code, config, state);
    
    // Get user profile
    const profile = await this.getUserProfile(platform, tokens.access_token);
    
    // Save or update social account
    const socialAccount = await this.saveOrUpdateSocialAccount(
      stateData.userId,
      platform,
      profile,
      tokens
    );

    // Clean up state
    await cacheService.del(`oauth_state:${state}`);
    if (platform === 'Twitter') {
      await cacheService.del(`twitter_challenge:${state}`);
    }

    return socialAccount;
  }

  private async exchangeCodeForTokens(
    platform: SocialPlatform, 
    code: string, 
    config: OAuthConfig, 
    state: string
  ): Promise<TokenResponse> {
    switch (platform) {
      case 'Twitter':
        return this.exchangeTwitterCode(code, config, state);
      case 'LinkedIn':
        return this.exchangeLinkedInCode(code, config);
      case 'Instagram':
        return this.exchangeInstagramCode(code, config);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async exchangeTwitterCode(code: string, config: OAuthConfig, state: string): Promise<TokenResponse> {
    const codeChallenge = await cacheService.get<string>(`twitter_challenge:${state}`);
    
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        code_verifier: codeChallenge!
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twitter OAuth error: ${error}`);
    }

    return response.json();
  }

  private async exchangeLinkedInCode(code: string, config: OAuthConfig): Promise<TokenResponse> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn OAuth error: ${error}`);
    }

    return response.json();
  }

  private async exchangeInstagramCode(code: string, config: OAuthConfig): Promise<TokenResponse> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Instagram OAuth error: ${error}`);
    }

    return response.json();
  }

  private async getUserProfile(platform: SocialPlatform, accessToken: string): Promise<UserProfile> {
    switch (platform) {
      case 'Twitter':
        return this.getTwitterProfile(accessToken);
      case 'LinkedIn':
        return this.getLinkedInProfile(accessToken);
      case 'Instagram':
        return this.getInstagramProfile(accessToken);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async getTwitterProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Twitter profile');
    }

    const data = await response.json();
    const user = data.data;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.profile_image_url || ''
    };
  }

  private async getLinkedInProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn profile');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      username: data.id, // LinkedIn doesn't have usernames like Twitter
      name: `${data.firstName.localized.en_US} ${data.lastName.localized.en_US}`,
      avatarUrl: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || ''
    };
  }

  private async getInstagramProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error('Failed to get Instagram profile');
    }

    const data = await response.json();

    return {
      id: data.id,
      username: data.username,
      name: data.username,
      avatarUrl: '' // Instagram Basic Display API doesn't provide profile pictures
    };
  }

  private async saveOrUpdateSocialAccount(
    userId: string,
    platform: SocialPlatform,
    profile: UserProfile,
    tokens: TokenResponse
  ): Promise<SocialAccount> {
    try {
      await clientPromise;

      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : undefined;

      const existingAccount = await SocialAccountModel.findOne({
        userId,
        platform
      });

      let account;
      if (existingAccount) {
        existingAccount.username = profile.username;
        existingAccount.avatarUrl = profile.avatarUrl;
        existingAccount.accessToken = tokens.access_token;
        existingAccount.refreshToken = tokens.refresh_token;
        existingAccount.tokenExpiresAt = expiresAt;
        account = await existingAccount.save();
      } else {
        account = new SocialAccountModel({
          userId,
          platform,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt
        });
        await account.save();
      }

      // Cache the tokens
      await cacheService.cacheToken(userId, platform, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt
      }, tokens.expires_in || 3600);

      return account.toJSON() as SocialAccount;
    } catch (error) {
      console.error('Error saving social account:', error);
      throw new Error('Failed to save social account');
    }
  }

  // Token Management
  async refreshToken(accountId: string): Promise<void> {
    try {
      await clientPromise;
      
      const account = await SocialAccountModel.findById(accountId);
      if (!account || !account.refreshToken) {
        throw new Error('Account or refresh token not found');
      }

      const config = this.getOAuthConfig(account.platform as SocialPlatform);
      const newTokens = await this.refreshAccessToken(account.platform as SocialPlatform, account.refreshToken, config);

      // Update account with new tokens
      account.accessToken = newTokens.access_token;
      if (newTokens.refresh_token) {
        account.refreshToken = newTokens.refresh_token;
      }
      if (newTokens.expires_in) {
        account.tokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      }
      await account.save();

      // Update cache
      await cacheService.cacheToken(account.userId.toString(), account.platform, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: account.tokenExpiresAt
      }, newTokens.expires_in || 3600);

    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  private async refreshAccessToken(platform: SocialPlatform, refreshToken: string, config: OAuthConfig): Promise<TokenResponse> {
    // Implementation varies by platform
    switch (platform) {
      case 'Twitter':
        // Twitter OAuth 2.0 with refresh tokens
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
        });

        if (!response.ok) {
          throw new Error('Failed to refresh Twitter token');
        }

        return response.json();

      default:
        throw new Error(`Token refresh not implemented for ${platform}`);
    }
  }

  // Account Management
  async verifyConnection(accountId: string): Promise<boolean> {
    try {
      await clientPromise;
      
      const account = await SocialAccountModel.findById(accountId);
      if (!account) {
        return false;
      }

      // Try to make a simple API call to verify the connection
      const isValid = await this.testApiConnection(account.platform as SocialPlatform, account.accessToken!);
      
      if (!isValid && account.refreshToken) {
        // Try to refresh the token
        await this.refreshToken(accountId);
        return this.testApiConnection(account.platform as SocialPlatform, account.accessToken!);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying connection:', error);
      return false;
    }
  }

  private async testApiConnection(platform: SocialPlatform, accessToken: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'Twitter':
          const twitterResponse = await fetch('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          return twitterResponse.ok;

        case 'LinkedIn':
          const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          return linkedinResponse.ok;

        case 'Instagram':
          const instagramResponse = await fetch(`https://graph.instagram.com/me?access_token=${accessToken}`);
          return instagramResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async disconnectAccount(accountId: string): Promise<void> {
    try {
      await clientPromise;
      
      const account = await SocialAccountModel.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Invalidate cached tokens
      await cacheService.invalidateToken(account.userId.toString(), account.platform);

      // Remove the account
      await SocialAccountModel.findByIdAndDelete(accountId);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw new Error('Failed to disconnect account');
    }
  }

  async getUserAccounts(userId: string): Promise<SocialAccount[]> {
    try {
      await clientPromise;
      
      const accounts = await SocialAccountModel.find({ userId });
      return accounts.map(account => account.toJSON() as SocialAccount);
    } catch (error) {
      console.error('Error getting user accounts:', error);
      throw new Error('Failed to get user accounts');
    }
  }
}

export const socialMediaService = SocialMediaService.getInstance();