import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORM SUBMISSION TEST ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to get the body as text first
    const rawBody = await request.text();
    console.log('Raw body length:', rawBody.length);
    console.log('Raw body content:', rawBody);
    
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Empty request body',
        debug: {
          bodyLength: rawBody.length,
          bodyContent: rawBody,
          headers: Object.fromEntries(request.headers.entries())
        }
      }, { status: 400 });
    }
    
    // Try to parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawBody);
      console.log('Successfully parsed JSON:', parsedData);
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        debug: {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
          rawBody: rawBody,
          bodyLength: rawBody.length
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Form submission received successfully',
      data: parsedData,
      debug: {
        bodyLength: rawBody.length,
        parsedFields: Object.keys(parsedData),
        requiredFields: ['affiliateId', 'companyName', 'firstName', 'lastName', 'email', 'offerId', 'creativeType', 'priority']
      }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Form submission test endpoint',
    usage: 'Send a POST request to test form data parsing',
    testData: {
      affiliateId: 'TEST123',
      companyName: 'Test Company',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      offerId: '58',
      creativeType: 'email',
      priority: 'high'
    }
  });
}
