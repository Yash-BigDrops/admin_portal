import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple API test working',
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      postgresUrl: process.env.POSTGRES_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES'))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
