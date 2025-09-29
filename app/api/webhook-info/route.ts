import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://admin.cms.bigdropsmarketing.com';

  return NextResponse.json({
    webhook_url: `${baseUrl}/api/webhooks/secure`,
    environment: process.env.NODE_ENV,
    vercel_url: process.env.VERCEL_URL,
    instructions: {
      publisher_form_config: {
        webhook_url: `${baseUrl}/api/webhooks/secure`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (process.env.PUBLISHER_API_TOKEN || 'your-api-token')
        },
        sample_payload: {
          affiliateId: "12345",
          companyName: "Test Company",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          telegramId: "@johndoe",
          offerId: "58",
          creativeType: "email",
          priority: "high",
          additionalNotes: "Test submission",
          submissionDate: new Date().toISOString()
        }
      },
      testing: {
        test_webhook: `curl -X POST ${baseUrl}/api/webhooks/secure -H "Content-Type: application/json" -H "Authorization: Bearer ${process.env.PUBLISHER_API_TOKEN || 'your-api-token'}" -d '{"affiliateId":"12345","companyName":"Test Company","firstName":"John","lastName":"Doe","email":"john@example.com","offerId":"58","creativeType":"email","priority":"high"}'`
      }
    }
  });
}
