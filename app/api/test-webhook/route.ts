import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    console.log('Test webhook received:');
    console.log('- Headers:', Object.fromEntries(request.headers.entries()));
    console.log('- Body:', body);
    console.log('- Auth Header:', authHeader);
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook received successfully',
      received_at: new Date().toISOString(),
      data: {
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
        auth_header: authHeader
      }
    });
    
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test webhook failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint is ready',
    usage: 'Send a POST request to test webhook functionality',
    webhook_url: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/test-webhook`
      : 'https://admin.cms.bigdropsmarketing.com/api/test-webhook'
  });
}
