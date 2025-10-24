import { NextResponse } from 'next/server';
import { auth } from '@/lib/simple-auth';

export async function GET() {
  try {
    console.log('Testing simple auth function...');
    
    // Try to get the session
    const session = await auth();
    
    console.log('Simple auth session result:', session);
    
    return NextResponse.json({
      success: true,
      session: session,
      message: 'Simple auth test completed'
    });

  } catch (error) {
    console.error('Simple auth test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        message: 'Simple auth test failed'
      },
      { status: 500 }
    );
  }
}
