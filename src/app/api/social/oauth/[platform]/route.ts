import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import SocialMediaService from '@/lib/social-media';
import { SocialPlatform } from '@/lib/types';

// Initiate OAuth flow
async function handleOAuthInitiation(
  request: AuthenticatedRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as SocialPlatform;
    
    // Validate platform
    if (!['Twitter', 'LinkedIn', 'Instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      );
    }

    const socialMediaService = SocialMediaService.getInstance();
    const authUrl = await socialMediaService.initiateOAuth(platform, request.user.userId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleOAuthInitiation);