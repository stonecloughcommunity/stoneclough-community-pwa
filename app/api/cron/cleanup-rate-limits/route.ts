import { NextRequest, NextResponse } from 'next/server';
import { cleanupRateLimitData } from '@/lib/security/rate-limit';
import { captureMessage } from '@/lib/monitoring/sentry';

// This API route is called by Vercel Cron Jobs to clean up old rate limit data
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    captureMessage('Starting rate limit cleanup', 'info');

    await cleanupRateLimitData();

    captureMessage('Rate limit cleanup completed successfully', 'info');

    return NextResponse.json({
      success: true,
      message: 'Rate limit cleanup completed',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    captureMessage(`Rate limit cleanup failed: ${errorMessage}`, 'error');

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
