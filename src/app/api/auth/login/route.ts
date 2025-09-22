
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import User from '@/models/User';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function ensureDbConnection() {
    await clientPromise;
}

export async function POST(request: Request) {
  console.log('Login API: Received request.');
  try {
    await ensureDbConnection();
    const { email, password } = await request.json();
    console.log('Login API: Received request for email:', email);


    if (!email || !password) {
      console.error('Login API: Email and password are required');
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      console.warn('Login API: User not found for email:', email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('Login API: Found user. Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Login API: Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.warn('Login API: Invalid password for email:', email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('!!! Login API: JWT_SECRET is not defined!');
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secret,
      { expiresIn: '1d' }
    );
    console.log('Login API: JWT token generated successfully.');
    
    const userObject = {
        id: user.id,
        name: user.name,
        email: user.email,
    };
    
    return NextResponse.json({ user: userObject, token }, { status: 200 });

  } catch (error: any) {
    console.error('!!! Login API: FATAL ERROR during login:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
