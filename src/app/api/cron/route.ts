
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Post from '@/models/Post';
import { publishPost } from '@/lib/publisher';

async function ensureDbConnection() {
    await clientPromise;
}

// This endpoint will be triggered by an external cron job service.
export async function GET(request: Request) {
  // 1. Secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbConnection();

    // 2. Find posts that are due
    const now = new Date();
    const duePosts = await Post.find({
      status: 'scheduled',
      date: { $lte: now },
    }).select('_id');

    if (duePosts.length === 0) {
      console.log('Cron job ran: No posts due for publishing.');
      return NextResponse.json({ message: 'No posts to publish' }, { status: 200 });
    }

    console.log(`Cron job ran: Found ${duePosts.length} post(s) to publish.`);

    // 3. Trigger publishing for each post
    // We do this in a loop rather than Promise.all to avoid overwhelming the system
    // and to handle each post's outcome independently.
    for (const post of duePosts) {
      // The actual publishing logic is in a separate function.
      // This is a "fire and forget" approach for the cron job.
      // The `publishPost` function will handle its own success/error states.
      publishPost(post._id.toString());
    }

    return NextResponse.json({ message: `Triggered publishing for ${duePosts.length} posts.` }, { status: 200 });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
