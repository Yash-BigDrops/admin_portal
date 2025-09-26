export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CLIENT = 'client'
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface PublisherRequest {
  id: string;
  publisherName: string;
  email: string;
  companyName: string | null;
  telegramId: string | null;
  offerId: string | null;
  creativeType: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'admin_approved' | 'client_review' | 'approved' | 'rejected';
  submittedData: Record<string, any>;
  adminNotes: string | null;
  clientNotes: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormConfiguration {
  id: string;
  name: string;
  description: string | null;
  formSchema: Record<string, any>;
  isActive: boolean;
  version: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferAssignment {
  id: string;
  publisherEmail: string;
  offerId: string;
  isActive: boolean;
  assignedBy: string | null;
  createdAt: Date;
}

export interface LLMTrainingData {
  id: string;
  requestId: string;
  creativeContent: string | null;
  fromLines: string[] | null;
  subjectLines: string[] | null;
  creativeType: string | null;
  offerCategory: string | null;
  approvalStatus: string | null;
  adminFeedback: string | null;
  clientFeedback: string | null;
  performanceScore: number | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
