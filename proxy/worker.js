// CORS proxy for AbuseIPDB. The browser sends the user's API key in the `Key`
// header; this worker forwards it unchanged and stores no secrets.

const UPSTREAM = 'https://api.abuseipdb.com';
const ALLOWED_PATHS = new Set(['/api/v2/check']);
const ALLOWED_ORIGINS = new Set([
  'https://markatroot.github.io',
  'http://localhost:4200',
]);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Key, Accept',
    'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') ?? '';
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response('Forbidden origin', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    if (request.method !== 'GET' || !ALLOWED_PATHS.has(url.pathname)) {
      return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
    }

    const upstream = await fetch(UPSTREAM + url.pathname + url.search, {
      headers: {
        Key: request.headers.get('Key') ?? '',
        Accept: 'application/json',
      },
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
