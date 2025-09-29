import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { captureMessage } from '@/lib/monitoring/sentry';
import { env } from '@/lib/config/environment';

interface PerformanceAlert {
  metric: {
    id: string;
    name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  timestamp: string;
  userAgent: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const alertData: PerformanceAlert = await request.json();
    
    // Only process poor performance metrics
    if (alertData.metric.rating !== 'poor') {
      return NextResponse.json({ success: true });
    }

    const supabase = await createClient();
    
    // Store performance alert in database
    const { error: dbError } = await supabase
      .from('performance_alerts')
      .insert({
        metric_name: alertData.metric.name,
        metric_value: alertData.metric.value,
        metric_rating: alertData.metric.rating,
        url: alertData.url,
        user_agent: alertData.userAgent,
        created_at: alertData.timestamp,
      });

    if (dbError) {
      console.error('Failed to store performance alert:', dbError);
    }

    // Send alert to monitoring service
    captureMessage(
      `Poor ${alertData.metric.name} performance detected`,
      'warning',
      {
        metric: alertData.metric,
        url: alertData.url,
        userAgent: alertData.userAgent,
      }
    );

    // Send Slack notification for critical performance issues
    if (shouldSendSlackAlert(alertData.metric)) {
      await sendSlackAlert(alertData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance alert API error:', error);
    return NextResponse.json(
      { error: 'Failed to process performance alert' },
      { status: 500 }
    );
  }
}

function shouldSendSlackAlert(metric: PerformanceAlert['metric']): boolean {
  // Define thresholds for Slack alerts (worse than "poor")
  const criticalThresholds = {
    CLS: 0.5,
    FCP: 5000,
    FID: 500,
    LCP: 6000,
    TTFB: 3000,
  };

  return metric.value > criticalThresholds[metric.name];
}

async function sendSlackAlert(alertData: PerformanceAlert) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhookUrl) {
    console.warn('Slack webhook URL not configured');
    return;
  }

  const message = {
    text: `🚨 Critical Performance Alert`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Critical Performance Alert',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Metric:* ${alertData.metric.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Value:* ${alertData.metric.value}ms`,
          },
          {
            type: 'mrkdwn',
            text: `*Rating:* ${alertData.metric.rating}`,
          },
          {
            type: 'mrkdwn',
            text: `*URL:* ${alertData.url}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Time: ${new Date(alertData.timestamp).toLocaleString()}`,
          },
        ],
      },
    ],
  };

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}
