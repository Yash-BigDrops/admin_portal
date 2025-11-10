'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const [errorCount, setErrorCount] = useState(0);

  const triggerError = () => {
    setErrorCount(prev => prev + 1);
    throw new Error(`Test error #${errorCount + 1} from Sentry test page`);
  };

  const triggerAsyncError = async () => {
    setErrorCount(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error(`Async test error #${errorCount + 1} from Sentry test page`);
  };

  const triggerSentryError = () => {
    setErrorCount(prev => prev + 1);
    Sentry.captureException(new Error(`Manual Sentry error #${errorCount + 1}`));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Sentry Error Testing
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              This page helps you test Sentry error reporting. 
              Check your Sentry dashboard after triggering errors.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={triggerError}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Trigger Client Error
            </button>

            <button
              onClick={triggerAsyncError}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Trigger Async Error
            </button>

            <button
              onClick={triggerSentryError}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Trigger Manual Sentry Error
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Errors triggered: {errorCount}
          </div>

          <div className="mt-6 pt-4 border-t">
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
