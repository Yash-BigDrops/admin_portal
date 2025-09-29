import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body first to check if it's empty
    const rawBody = await request.text();
    
    console.log('Raw request body:', rawBody);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if body is empty
    if (!rawBody || rawBody.trim() === '') {
      console.error('Empty request body received');
      return NextResponse.json({ 
        success: false, 
        error: 'Empty request body' 
      }, { status: 400 });
    }
    
    let formData;
    try {
      formData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw body that failed to parse:', rawBody);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON format',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 });
    }
    
    console.log('Parsed form data:', formData);
    
    // Validate required fields
    const requiredFields = ['affiliateId', 'companyName', 'firstName', 'lastName', 'email', 'offerId', 'creativeType', 'priority'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields',
        missingFields 
      }, { status: 400 });
    }
    
    // Forward to Admin Portal webhook
    const adminWebhookUrl = 'https://admin.cms.bigdropsmarketing.com/api/webhooks/secure';
    const apiToken = 'f2a56c89e25d4b1f98920e1a64403db6e6a46935a861e7e67d3cfa4c8c7b2d';
    
    console.log('Forwarding to admin webhook:', adminWebhookUrl);
    
    const response = await fetch(adminWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        affiliateId: formData.affiliateId,
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        telegramId: formData.telegramId || '',
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        priority: formData.priority,
        additionalNotes: formData.additionalNotes || '',
        submissionDate: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    console.log('Admin webhook response:', result);
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Form submitted successfully',
        submissionId: result.submissionId 
      });
    } else {
      console.error('Admin webhook error:', result);
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to submit to admin portal'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Publisher form webhook endpoint is ready',
    usage: 'Send a POST request with form data',
    requiredFields: ['affiliateId', 'companyName', 'firstName', 'lastName', 'email', 'offerId', 'creativeType', 'priority'],
    optionalFields: ['telegramId', 'additionalNotes']
  });
}
