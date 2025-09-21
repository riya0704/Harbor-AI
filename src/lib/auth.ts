import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { UserDocument } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token: string): any | null {
  if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export type AuthenticatedRequest = NextRequest & {
    user: {
        userId: string;
    }
}

export function withAuth(handler: (req: AuthenticatedRequest, ...args: any) => Promise<NextResponse>) {
    return async (req: NextRequest, ...args: any) => {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
        }
        
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = { userId: decoded.userId };
        
        return handler(authenticatedReq, ...args);
    };
}
