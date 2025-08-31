import { auth0 } from '@/lib/auth0';

const API_BASE = process.env.BACKEND_URL as string;

export async function GET(req: Request): Promise<Response> {
  const handler = auth0.withApiAuthRequired(async () => {
    try {
      const { token } = await auth0.getAccessToken();
      if (!API_BASE) {
        throw new Error('BACKEND_URL is not configured');
      }
      const res = await fetch(`${API_BASE}/api/admin/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const text = await res.text();
      return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
    } catch (e: any) {
      console.error('Proxy GET /api/proxy/admin/appointments failed:', e);
      return new Response(JSON.stringify({ message: e?.message || 'Proxy error' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }
  });
  return (handler as (req: Request) => Promise<Response>)(req);
}
