'use server';

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Post from '@/models/Post';
import mongoose from 'mongoose';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';


async function ensureDbConnection() {
    await clientPromise;
}

// PUT /api/posts/[id]
export const PUT = withAuth(async function PUT(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbConnection();
    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }

    // Ensure the post belongs to the user
    const post = await Post.findById(id);
    if (!post || post.userId.toString() !== request.user.userId) {
        return NextResponse.json({ message: 'Post not found or unauthorized' }, { status: 404 });
    }

    // Exclude _id from update body to prevent errors
    const { _id, ...updateData } = body;

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedPost) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPost.toObject(), { status: 200 });
  } catch (error) {
    console.error(`Failed to update post ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update post' }, { status: 500 });
  }
});


// DELETE /api/posts/[id]
export const DELETE = withAuth(async function DELETE(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbConnection();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    // Ensure the post belongs to the user
    const post = await Post.findById(id);
    if (!post || post.userId.toString() !== request.user.userId) {
        return NextResponse.json({ message: 'Post not found or unauthorized' }, { status: 404 });
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete post ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
  }
});
