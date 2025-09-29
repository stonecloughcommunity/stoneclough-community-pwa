import { NextRequest, NextResponse } from 'next/server';
import { databaseBackupService } from '@/lib/backup/database';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';

// This API route is called by Vercel Cron Jobs
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    captureMessage('Starting scheduled database backup', 'info');

    // Perform full backup
    const result = await databaseBackupService.createBackup({
      type: 'full',
      retentionDays: 30,
      compress: true,
      encrypt: true,
    });

    if (!result.success) {
      throw new Error(result.error || 'Backup failed');
    }

    // Verify the backup
    const isValid = await databaseBackupService.verifyBackup(result.id);
    
    if (!isValid) {
      captureMessage('Backup verification failed', 'warning', {
        backupId: result.id,
      });
    }

    // Clean up old backups
    await databaseBackupService.cleanupOldBackups();

    captureMessage('Scheduled database backup completed successfully', 'info', {
      backupId: result.id,
      size: result.size,
      verified: isValid,
    });

    return NextResponse.json({
      success: true,
      backupId: result.id,
      size: result.size,
      verified: isValid,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    captureException(error instanceof Error ? error : new Error(errorMessage), {
      operation: 'scheduled_backup',
    });

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
