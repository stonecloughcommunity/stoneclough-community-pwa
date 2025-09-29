import { NextRequest, NextResponse } from 'next/server';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { applyAPISecurityHeaders } from '@/lib/security/headers';

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the CSP violation report
    let report: CSPViolationReport;

    if (typeof request.json === 'function') {
      report = await request.json();
    } else {
      // Fallback for test environment
      const body = (request as any).body;
      if (typeof body === 'string') {
        report = JSON.parse(body);
      } else {
        report = body || {};
      }
    }

    const violation = report['csp-report'];

    if (!violation) {
      console.warn('Invalid CSP report format - missing csp-report field');
      return NextResponse.json({ error: 'Invalid CSP report format' }, { status: 400 });
    }

    // Log the violation details
    const violationDetails = {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      scriptSample: violation['script-sample'],
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    // Determine if this is a critical violation
    const criticalDirectives = [
      'script-src',
      'object-src',
      'base-uri',
      'form-action',
    ];

    const isCritical = criticalDirectives.some(directive =>
      violation['violated-directive'].includes(directive)
    );

    // Filter out common false positives
    const isKnownFalsePositive = [
      'chrome-extension:',
      'moz-extension:',
      'safari-extension:',
      'ms-browser-extension:',
      'about:blank',
      'data:text/html,chromewebdata',
    ].some(pattern => violation['blocked-uri'].includes(pattern));

    if (!isKnownFalsePositive) {
      if (isCritical) {
        captureException(new Error('Critical CSP Violation'), {
          tags: {
            type: 'csp_violation',
            severity: 'high',
          },
          extra: violationDetails,
        });
      } else {
        captureMessage('CSP Violation Reported', 'warning', {
          tags: {
            type: 'csp_violation',
            severity: 'medium',
          },
          extra: violationDetails,
        });
      }
    }

    // Return success response
    const response = NextResponse.json({ received: true }, { status: 204 });
    return applyAPISecurityHeaders(response);

  } catch (error) {
    console.error('CSP report processing error:', error);
    
    captureException(error instanceof Error ? error : new Error('CSP report processing failed'), {
      tags: {
        type: 'csp_report_error',
      },
    });

    const response = NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 500 }
    );
    return applyAPISecurityHeaders(response);
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return applyAPISecurityHeaders(response);
}
