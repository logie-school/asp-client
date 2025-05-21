export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Forward the content type
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(blob, {
      headers: headers
    });
  } catch (error) {
    return new Response('Error fetching image', { status: 500 });
  }
}