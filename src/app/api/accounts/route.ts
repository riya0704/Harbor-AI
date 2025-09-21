import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';

async function ensureDbConnection() {
    await clientPromise;
}

// GET /api/accounts
export async function GET() {
  try {
    await ensureDbConnection();
    const accounts = await SocialAccount.find({ userId: 'user1' }); // Hardcoded for now
    
    const formattedAccounts = accounts.map(a => ({
        ...a.toObject(),
        id: a._id.toString(),
    }));

    return NextResponse.json(formattedAccounts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ message: 'Failed to fetch accounts' }, { status: 500 });
  }
}
