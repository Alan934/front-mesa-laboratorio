import { auth0 } from '@/lib/auth0';

const API_BASE = process.env.BACKEND_URL as string;

function getStatusFromError(e: unknown, fallback: number): number {
  if (typeof e === 'object' && e !== null) {
    const obj = e as { status?: unknown; statusCode?: unknown };
    if (typeof obj.status === 'number') return obj.status;
    if (typeof obj.statusCode === 'number') return obj.statusCode;
  }
  return fallback;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const handler = auth0.withApiAuthRequired(async () => {
      try {
        const { token } = await auth0.getAccessToken();
        if (!API_BASE) throw new Error('BACKEND_URL is not configured');
        const res = await fetch(`${API_BASE}/api/users/me/schedule`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const text = await res.text();
        return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
      } catch (e: unknown) {
        console.error('Proxy GET /api/proxy/users/me/schedule (inner) failed:', e);
        const message = e instanceof Error ? e.message : 'Proxy error';
        return new Response(JSON.stringify({ message }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        });
      }
    });
    return await (handler as (req: Request) => Promise<Response>)(req);
  } catch (e: unknown) {
    console.error('Proxy GET /api/proxy/users/me/schedule (outer) failed:', e);
    const status = getStatusFromError(e, 401);
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return new Response(JSON.stringify({ message }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const handler = auth0.withApiAuthRequired(async () => {
      try {
        const { token } = await auth0.getAccessToken();
        if (!API_BASE) throw new Error('BACKEND_URL is not configured');
        const body = await req.text();
        const res = await fetch(`${API_BASE}/api/users/me/schedule`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body,
        });
        const text = await res.text();
        return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
      } catch (e: unknown) {
        console.error('Proxy PUT /api/proxy/users/me/schedule (inner) failed:', e);
        const message = e instanceof Error ? e.message : 'Proxy error';
        return new Response(JSON.stringify({ message }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        });
      }
    });
    return await (handler as (req: Request) => Promise<Response>)(req);
  } catch (e: unknown) {
    console.error('Proxy PUT /api/proxy/users/me/schedule (outer) failed:', e);
    const status = getStatusFromError(e, 401);
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return new Response(JSON.stringify({ message }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
}
