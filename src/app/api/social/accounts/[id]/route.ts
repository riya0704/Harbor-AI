import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import SocialAccountModel from '@/models/SocialAccount';
import SocialMediaService from '@/lib/social-media';
import clientPromise from '@/lib/mongodb';

// Delete/disconnect social account
async function deleteAccount(
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
    await socialMediaService.disconnectAccount(accountId);

    return NextResponse.json({ 
      message: 'Account disconnected successfully',
      platform: account.platform 
    });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(deleteAccount);