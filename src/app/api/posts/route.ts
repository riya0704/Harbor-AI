import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Post from '@/models/Post';
import { Post as PostType } from '@/lib/types';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

// Ensure the database connection is established
async function ensureDbConnection() {
    await clientPromise;
}

// GET /api/posts
export const GET = withAuth(async function GET(request: AuthenticatedRequest) {
  try {
    await ensureDbConnection();
    const posts = await Post.find({ userId: request.user.userId });
    
    // Mongoose returns _id, so we map it to id
    const formattedPosts = posts.map(p => ({
        ...p.toObject(),
        id: p._id.toString(),
    }));

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
});

// POST /api/posts
export const POST = withAuth(async function POST(request: AuthenticatedRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    
    // Remove id if it exists, as MongoDB will generate it.
    const { id, ...postData } = body;
    
    const newPost = new Post({ ...postData, userId: request.user.userId });
    await newPost.save();
    
    return NextResponse.json({ ...newPost.toObject(), id: newPost._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
  }
});
