import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Debug NextAuth.js configuration...');
    
    // Check environment variables
    const envVars = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('Environment variables:', envVars);
    
    // Try to import NextAuth
    let nextAuthImport;
    try {
      nextAuthImport = await import('next-auth');
      console.log('NextAuth import successful');
    } catch (error: unknown) {
      console.error('NextAuth import error:', error);
      return NextResponse.json({
        success: false,
        error: 'NextAuth import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Try to create a simple NextAuth instance
    let nextAuthInstance;
    try {
      const NextAuth = nextAuthImport.default;
      nextAuthInstance = NextAuth({
        secret: process.env.NEXTAUTH_SECRET,
        session: { strategy: "jwt" as const },
        providers: []
      });
      console.log('NextAuth instance created successfully');
    } catch (error: unknown) {
      console.error('NextAuth instance creation error:', error);
      return NextResponse.json({
        success: false,
        error: 'NextAuth instance creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json({
      success: true,
      envVars,
      nextAuthVersion: 'unknown',
      message: 'NextAuth.js debug completed'
    });

  } catch (error: unknown) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
