import { NextRequest, NextResponse } from 'next/server';
import CronService from '@/lib/cron';
import SchedulerService from '@/lib/scheduler';

// Admin endpoint to manage cron jobs
export async function GET(request: NextRequest) {
  try {
    // Check for admin authorization (you can implement proper admin auth)
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cronService = CronService.getInstance();
    const schedulerService = SchedulerService.getInstance();

    const [jobsStatus, stats] = await Promise.all([
      cronService.getJobsStatus(),
      schedulerService.getStats()
    ]);

    return NextResponse.json({
      jobsStatus,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manually trigger post processing
export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, jobName } = await request.json();

    const cronService = CronService.getInstance();
    const schedulerService = SchedulerService.getInstance();

    switch (action) {
      case 'process_posts':
        await schedulerService.processScheduledPosts();
        return NextResponse.json({ message: 'Posts processed successfully' });

      case 'restart_job':
        if (!jobName) {
          return NextResponse.json({ error: 'Job name required' }, { status: 400 });
        }
        const restarted = cronService.restartJob(jobName);
        return NextResponse.json({ 
          message: restarted ? 'Job restarted' : 'Job not found' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing cron action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}