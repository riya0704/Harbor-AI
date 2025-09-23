import { NextRequest, NextResponse } from 'next/server';
import SocialMediaService from '@/lib/social-media';
import { SocialPlatform } from '@/lib/types';

// Handle OAuth callback
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as SocialPlatform;
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/connections?error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/connections?error=Missing authorization code or state`
      );
    }

    // Validate platform
    if (!['Twitter', 'LinkedIn', 'Instagram'].includes(platform)) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/connections?error=Unsupported platform`
      );
    }

    const socialMediaService = SocialMediaService.getInstance();
    const socialAccount = await socialMediaService.handleOAuthCallback(platform, code, state);

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/connections?success=Account connected successfully&platform=${platform}&username=${encodeURIComponent(socialAccount.username)}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect account';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/connections?error=${encodeURIComponent(errorMessage)}`
    );
  }
}