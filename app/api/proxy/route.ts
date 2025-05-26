import fetch from 'node-fetch';

export const dynamic = "force-static"; // Add this line

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing URL parameter', { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return new Response('Failed to fetch the image', { status: response.status });
    }

    const blob = await response.blob();

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(blob, { headers });
  } catch (error) {
    console.error('Error in /api/proxy:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}