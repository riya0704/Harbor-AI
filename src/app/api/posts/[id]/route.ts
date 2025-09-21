import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Post from '@/models/Post';
import mongoose from 'mongoose';

async function ensureDbConnection() {
    await clientPromise;
}

// PUT /api/posts/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDbConnection();
    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }

    // Exclude _id from update body to prevent errors
    const { _id, ...updateData } = body;

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedPost) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ ...updatedPost.toObject(), id: updatedPost._id.toString() }, { status: 200 });
  } catch (error) {
    console.error(`Failed to update post ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update post' }, { status: 500 });
  }
}
