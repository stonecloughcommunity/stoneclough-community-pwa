import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRateLimitAnalytics } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get timeframe from query params
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as '1h' | '24h' | '7d' || '24h';

    // Get rate limit analytics
    const analytics = await getRateLimitAnalytics(timeframe);

    return NextResponse.json({
      success: true,
      timeframe,
      analytics,
    });

  } catch (error) {
    console.error('Rate limit analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get rate limit analytics' },
      { status: 500 }
    );
  }
}
