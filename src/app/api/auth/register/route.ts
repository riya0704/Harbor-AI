import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function ensureDbConnection() {
    await clientPromise;
}

export async function POST(request: Request) {
  try {
    await ensureDbConnection();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
    });

    // The toJSON transform in the model will handle removing passwordHash
    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
