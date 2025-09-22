
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function ensureDbConnection() {
    await clientPromise;
}

export async function POST(request: Request) {
  console.log('Register API: Received request.');
  try {
    await ensureDbConnection();
    const { name, email, password } = await request.json();
    console.log('Register API: Received request for email:', email);


    if (!name || !email || !password) {
      console.error('Register API: Missing required fields.');
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('Register API: User already exists for email:', email);
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    console.log('Register API: Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Register API: Password hashing successful.');

    const newUser = await User.create({
      name,
      email,
      passwordHash,
    });
    console.log('Register API: User created successfully in DB for email:', email);

    // The toJSON transform in the model will handle removing passwordHash
    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    console.error('!!! Register API: FATAL ERROR during registration:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
