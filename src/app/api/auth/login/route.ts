
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function ensureDbConnection() {
    await clientPromise;
}

export async function POST(request: Request) {
  try {
    await ensureDbConnection();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secret,
      { expiresIn: '1d' }
    );
    
    const userObject = user.toObject();
    delete userObject.passwordHash;

    return NextResponse.json({ user: userObject, token }, { status: 200 });

  } catch (error: any) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
