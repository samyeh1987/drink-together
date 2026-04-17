import { NextResponse } from 'next/server';

// This endpoint is called by Vercel Cron every 5 minutes
// to check and update meal statuses via Supabase RPC
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Call the Supabase RPC function directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_meal_deadlines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cron check_meal_deadlines error:', errorText);
      return NextResponse.json(
        { error: errorText, success: false },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal deadlines checked',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Cron job error:', err);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
