import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import SocialAccountModel from '@/models/SocialAccount';
import SocialMediaService from '@/lib/social-media';
import clientPromise from '@/lib/mongodb';

// Verify social account connection
async function verifyAccount(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clientPromise;
    
    const accountId = params.id;
    
    // Verify account belongs to user
    const account = await SocialAccountModel.findOne({
      _id: accountId,
      userId: request.user.userId
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const socialMediaService = SocialMediaService.getInstance();
    const isConnected = await socialMediaService.verifyConnection(accountId);

    return NextResponse.json({ 
      connected: isConnected,
      platform: account.platform,
      username: account.username,
      lastVerified: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying account:', error);
    return NextResponse.json(
      { error: 'Failed to verify account connection' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(verifyAccount);