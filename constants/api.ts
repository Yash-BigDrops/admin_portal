export const API_ENDPOINTS = {
  // Authentication (handled by NextAuth at /api/auth/[...nextauth])
  REGISTER: '/api/auth/register',
  VERIFY_OTP: '/api/auth/verify-otp',
  REFRESH_TOKEN: '/api/auth/refresh',

  // Dashboard
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  RECENT_ACTIVITY: '/api/dashboard/recent-activity',

  // Requests
  REQUESTS: '/api/requests',
  REQUEST_APPROVE: '/api/requests/approve',
  REQUEST_REJECT: '/api/requests/reject',
  BULK_APPROVE: '/api/requests/bulk-approve',
  BULK_REJECT: '/api/requests/bulk-reject',

  // Form Configuration
  FORM_CONFIG: '/api/form-config',
  FORM_FIELDS: '/api/form-config/fields',
  FORM_VALIDATION: '/api/form-config/validation',
  FORM_PREVIEW: '/api/form-config/preview',

  // Users
  ADVERTISERS: '/api/advertisers',
  PUBLISHERS: '/api/publishers',
  USERS: '/api/users',

  // Offers
  OFFERS: '/api/offers',
  EVERFLOW_SYNC: '/api/offers/everflow/sync',
  OFFER_ASSIGNMENTS: '/api/offers/assignments',

  // LLM
  LLM_GENERATE_FROM_LINES: '/api/llm/generate/from-lines',
  LLM_GENERATE_SUBJECT_LINES: '/api/llm/generate/subject-lines',
  LLM_PROOFREAD: '/api/llm/generate/proofread',
  LLM_TRAINING_DATA: '/api/llm/training/collect',

  // Analytics
  ANALYTICS: '/api/analytics',
  APPROVAL_RATES: '/api/analytics/approval-rates',
  PERFORMANCE: '/api/analytics/performance',

  // Integration
  PUBLISHER_PORTAL_CONFIG: '/api/integration/publisher-portal/form-config',
  PUBLISHER_PORTAL_OFFERS: '/api/integration/publisher-portal/offers',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
