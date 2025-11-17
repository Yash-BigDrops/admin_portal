import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Simulate an error for testing
    throw new Error('Test API error for Sentry verification');
  } catch (error: unknown) {
    // Report to Sentry
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        endpoint: 'test-error',
        test: true
      },
      extra: {
        requestUrl: request.url,
        timestamp: new Date().toISOString()
      }
    });
    
    return NextResponse.json({ 
      error: 'Test error captured by Sentry',
      message: 'Check your Sentry dashboard for this error'
    }, { status: 500 });
  }
}
