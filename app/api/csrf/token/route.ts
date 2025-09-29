import { NextRequest } from 'next/server';
import { getCSRFToken } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    const { token, response } = await getCSRFToken(request);
    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate CSRF token' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
