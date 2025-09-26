import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRoles?: string[]
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Get token from Authorization header or cookies
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '') || 
                   req.cookies.get('admin-token')?.value;

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = AuthService.verifyToken(token);
      
      // Check if user role is allowed
      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user info to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      return handler(req);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  };
}
