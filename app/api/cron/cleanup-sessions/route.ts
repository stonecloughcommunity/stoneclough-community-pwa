import { NextRequest, NextResponse } from 'next/server';
import { sessionManagementService } from '@/lib/auth/session-management';
import { captureMessage, captureException } from '@/lib/monitoring/sentry';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up expired sessions
    await sessionManagementService.cleanupExpiredSessions();

    captureMessage('Session cleanup completed', 'info', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Session cleanup failed';
    
    captureException(error instanceof Error ? error : new Error(errorMessage), {
      operation: 'session_cleanup_cron',
    });

    return NextResponse.json(
      { 
        error: 'Session cleanup failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export const POST = GET;
