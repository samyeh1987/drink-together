import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy Google Places Autocomplete API
 * Keeps the API key server-side only
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');
  const language = searchParams.get('language') || 'en';

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const params = new URLSearchParams({
      input,
      language,
      components: 'country:th',
      types: 'establishment',
      fields: 'name,formatted_address,geometry,place_id,types',
    });

    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      }
    );

    const data = await resp.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      // Fallback: try without types restriction (allow address search too)
      const fallbackParams = new URLSearchParams({
        input,
        language,
        components: 'country:th',
        fields: 'name,formatted_address,geometry,place_id,types',
      });

      const fallbackResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${fallbackParams}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
          },
        }
      );

      const fallbackData = await fallbackResp.json();
      return NextResponse.json(fallbackData);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Google Places proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}

/**
 * Proxy Google Places Details API
 * Used to get full details after a place is selected
 */
export async function POST(request: NextRequest) {
  const { placeId, language } = await request.json();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  if (!placeId) {
    return NextResponse.json(
      { error: 'placeId is required' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      language: language || 'en',
      fields: 'name,formatted_address,geometry/location,types',
    });

    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      }
    );

    const data = await resp.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || data.status },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Google Places Details proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
