import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.2,
  profilesSampleRate: 0.0,
  debug: false,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  sendDefaultPii: false, // Never send PII
  
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Filter out favicon and asset requests
    if (event.request?.url?.includes('/favicon.ico') || 
        event.request?.url?.includes('/_next/static/')) {
      return null;
    }
    
    return event;
  }
});