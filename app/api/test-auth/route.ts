import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    console.log('Testing auth function...');
    
    // Try to get the session
    const session = await auth();
    
    console.log('Session result:', session);
    
    return NextResponse.json({
      success: true,
      session: session,
      message: 'Auth test completed'
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        message: 'Auth test failed'
      },
      { status: 500 }
    );
  }
}
