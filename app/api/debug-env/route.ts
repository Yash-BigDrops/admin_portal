import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    node_env: process.env.NODE_ENV,
    vercel_url: process.env.VERCEL_URL,
    database_url_exists: !!process.env.DATABASE_URL,
    everflow_api_key_exists: !!process.env.EVERFLOW_API_KEY,
    jwt_secret_exists: !!process.env.JWT_SECRET,
    refresh_token_secret_exists: !!process.env.REFRESH_TOKEN_SECRET,
    publisher_api_token_exists: !!process.env.PUBLISHER_API_TOKEN,
    next_public_app_url: process.env.NEXT_PUBLIC_APP_URL,
    all_env_vars: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      EVERFLOW_API_KEY: process.env.EVERFLOW_API_KEY ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ? 'SET' : 'NOT SET',
      PUBLISHER_API_TOKEN: process.env.PUBLISHER_API_TOKEN ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    }
  });
}
