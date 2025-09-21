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


// POST /api/accounts
export const POST = withAuth(async function POST(request: AuthenticatedRequest) {
    try {
        await ensureDbConnection();
        const body = await request.json();
        const { platform, username } = body;

        if (!platform || !username) {
            return NextResponse.json({ message: 'Platform and username are required' }, { status: 400 });
        }

        // In a real app, you'd get the avatar and other details after OAuth
        const avatarUrl = `https://picsum.photos/seed/${username}/40/40`;

        const newAccount = new SocialAccount({
            platform,
            username,
            avatarUrl,
            userId: request.user.userId,
        });

        await newAccount.save();

        const accountObject = {
            ...newAccount.toObject(),
            id: newAccount._id.toString(),
        }

        return NextResponse.json(accountObject, { status: 201 });
    } catch (error) {
        console.error('Failed to add account:', error);
        return NextResponse.json({ message: 'Failed to add account' }, { status: 500 });
    }
});
