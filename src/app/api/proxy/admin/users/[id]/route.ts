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

export async function PUT(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const handler = auth0.withApiAuthRequired(async () => {
      try {
        const { token } = await auth0.getAccessToken();
        if (!API_BASE) throw new Error('BACKEND_URL is not configured');
        const body = await req.text();
        const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(params.id)}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body,
        });
        const text = await res.text();
        return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Proxy error';
        console.error('Proxy PUT /api/proxy/admin/users/[id] failed:', e);
        return new Response(JSON.stringify({ message }), { status: 502, headers: { 'content-type': 'application/json' } });
      }
    });
    return await (handler as (req: Request) => Promise<Response>)(req);
  } catch (e: unknown) {
    const status = getStatusFromError(e, 401);
    const message = e instanceof Error ? e.message : 'Unauthorized';
    console.error('Proxy PUT /api/proxy/admin/users/[id] (outer) failed:', e);
    return new Response(JSON.stringify({ message }), { status, headers: { 'content-type': 'application/json' } });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const handler = auth0.withApiAuthRequired(async () => {
      try {
        const { token } = await auth0.getAccessToken();
        if (!API_BASE) throw new Error('BACKEND_URL is not configured');
        const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(params.id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        return new Response(text || '', { status: res.status });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Proxy error';
        console.error('Proxy DELETE /api/proxy/admin/users/[id] failed:', e);
        return new Response(JSON.stringify({ message }), { status: 502, headers: { 'content-type': 'application/json' } });
      }
    });
    return await (handler as (req: Request) => Promise<Response>)(_req);
  } catch (e: unknown) {
    const status = getStatusFromError(e, 401);
    const message = e instanceof Error ? e.message : 'Unauthorized';
    console.error('Proxy DELETE /api/proxy/admin/users/[id] (outer) failed:', e);
    return new Response(JSON.stringify({ message }), { status, headers: { 'content-type': 'application/json' } });
  }
}
