import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    // Path originale senza il prefisso Netlify
    const prefix = '/.netlify/functions/matchshare-proxy/';
    const splat = event.path?.startsWith(prefix)
      ? event.path.slice(prefix.length)
      : '';

    // Query string originale
    const qs = event.rawQuery ? `?${event.rawQuery}` : '';

    // URL finale verso MatchShare
    const targetUrl = `https://srv6.matchshare.it/${splat}${qs}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // Header "da browser" → IMPORTANTISSIMI
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        Referer: 'https://srv6.matchshare.it/',
      },
    });

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        'content-type': contentType,
        // CORS per il frontend
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS',
        'access-control-allow-headers': 'Content-Type',
        // cache breve
        'cache-control': 'public, max-age=30',
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({
        error: 'matchshare_proxy_error',
        message: String(err?.message || err),
      }),
    };
  }
};