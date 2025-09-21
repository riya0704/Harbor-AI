import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function ensureDbConnection() {
    await clientPromise;
}

// GET /api/accounts
export const GET = withAuth(async function GET(request: AuthenticatedRequest) {
  try {
    await ensureDbConnection();
    const accounts = await SocialAccount.find({ userId: request.user.userId }); 
    
    const formattedAccounts = accounts.map(a => ({
        ...a.toObject(),
        id: a._id.toString(),
    }));

    return NextResponse.json(formattedAccounts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ message: 'Failed to fetch accounts' }, { status: 500 });
  }
});