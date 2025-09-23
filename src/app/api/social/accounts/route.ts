import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import SocialAccountModel from '@/models/SocialAccount';
import clientPromise from '@/lib/mongodb';

// Get user's connected social accounts
async function getAccounts(request: AuthenticatedRequest) {
  try {
    await clientPromise;
    
    const accounts = await SocialAccountModel
      .find({ userId: request.user.userId })
      .select('-accessToken -refreshToken') // Don't expose tokens
      .sort({ createdAt: -1 });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAccounts);