import { NextResponse } from 'next/server';
import { initializeServices } from '@/lib/init';
import redis from '@/lib/redis';
import clientPromise from '@/lib/mongodb';

// Health check endpoint that also initializes services
export async function GET() {
  try {
    // Initialize services on first health check
    await initializeServices();

    // Check database connection
    await clientPromise;
    
    // Check Redis connection
    await redis.ping();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        cron: process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true' ? 'running' : 'disabled'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}