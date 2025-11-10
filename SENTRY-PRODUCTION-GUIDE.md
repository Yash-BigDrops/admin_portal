# 🚀 Production Sentry Configuration Guide

## ✅ Production-Ready Settings

### Environment Variables for Vercel Production:

```bash
# Core App
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-64-char-random-secret
AUTH_TRUST_HOST=true
DATABASE_URL=postgresql://...
ENABLE_MOCK=false

# Sentry (Production Optimized)
SENTRY_DSN=https://09cd04e98a8697ec114d7e9cad099d5a@o4510268731359232.ingest.us.sentry.io/4510268761374720
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.0
SENTRY_ENVIRONMENT=production
```

## 🔔 Sentry Alert Rules (Copy-Paste Ready)

### 1. Critical Error Alert
**Condition:** When # of events in 1 min is > 0
**Filter:** `level:error AND environment:production`
**Action:** Email/Slack notification

### 2. Performance Alert  
**Condition:** Transaction duration for `/api/dashboard/*` > 800ms in 5 min
**Filter:** `environment:production`
**Action:** Email/Slack notification

### 3. High Error Rate Alert
**Condition:** When # of events in 5 min is > 10
**Filter:** `level:error AND environment:production`
**Action:** Email/Slack notification

## 🛡️ Security & Privacy Features

### ✅ Implemented:
- **No PII**: `sendDefaultPii=false` (never sends personal data)
- **Environment Filtering**: Only production errors tracked
- **Noise Filtering**: Health checks, favicon, assets ignored
- **Conservative Sampling**: 10% trace sampling in production
- **User Context**: Only non-PII identifiers (UUIDs)

### 🔒 Privacy Compliance:
- No email addresses sent to Sentry
- No personal names sent to Sentry  
- No sensitive data in error reports
- GDPR compliant error tracking

## 📊 Monitoring Endpoints

### Health Check:
- **URL**: `/api/health`
- **Purpose**: Uptime monitoring, filtered from Sentry
- **Response**: `{ status: "healthy", uptime: 123.45 }`

### Dashboard APIs (Monitored):
- `/api/dashboard/metrics` - Tagged with module/route
- `/api/dashboard/submissions-trend` - Performance tracked
- `/api/dashboard/recent-activity` - Error reporting enabled
- `/api/dashboard/requests` - Rate limited + monitored

## 🎯 Production Verification Checklist

### Before Deploy:
- [ ] Set `SENTRY_ENVIRONMENT=production` in Vercel
- [ ] Verify `SENTRY_TRACES_SAMPLE_RATE=0.1`
- [ ] Confirm `sendDefaultPii=false` in configs
- [ ] Test health check: `/api/health`

### After Deploy:
- [ ] Visit Sentry dashboard → Issues tab
- [ ] Trigger test error in production
- [ ] Verify source maps show TypeScript files
- [ ] Check performance data in Sentry
- [ ] Confirm alerts are configured

### Alert Testing:
- [ ] Create test alert rule
- [ ] Trigger test error
- [ ] Verify notification received
- [ ] Adjust thresholds if needed

## 🔧 Advanced Configuration

### Custom Error Handling:
```typescript
// Log handled errors as warnings
Sentry.captureException(error, { level: "warning" });

// Log informational messages
Sentry.captureMessage("Publisher sync completed", "info");

// Add custom tags
Sentry.setTag("module", "dashboard");
Sentry.setTag("route", "/api/dashboard/metrics");
```

### Performance Monitoring:
```typescript
// Track custom transactions
Sentry.startTransaction({
  name: "Publisher Sync",
  op: "sync"
});
```

## 🚨 Troubleshooting

### Common Issues:
1. **No errors in Sentry**: Check `SENTRY_ENVIRONMENT` matches
2. **Source maps not working**: Verify `SENTRY_AUTH_TOKEN` in Vercel
3. **Too many alerts**: Increase thresholds or add filters
4. **Missing context**: Add `Sentry.setTag()` calls

### Debug Mode:
```bash
# Enable debug logging (temporary)
SENTRY_DEBUG=true
```

---

**🎉 Your dashboard now has enterprise-grade error monitoring!**

- ✅ Production-ready error tracking
- ✅ Performance monitoring  
- ✅ Privacy-compliant data handling
- ✅ Automated alerting
- ✅ Health check endpoint
- ✅ Noise filtering

