import { auth0 } from '@/lib/auth0';

const API_BASE = process.env.BACKEND_URL as string;

type RouteCtx = { params?: Promise<Record<string, string | string[]>> };

export async function POST(req: Request, ctx: RouteCtx): Promise<Response> {
  const handler = auth0.withApiAuthRequired(async () => {
    const { token } = await auth0.getAccessToken();
    const params = (await ctx.params) || {};
    const id = params.id as string;
    const res = await fetch(`${API_BASE}/api/practitioner/appointments/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return new Response(await res.text(), { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
  });
  return (handler as (req: Request, ctx?: unknown) => Promise<Response>)(req, ctx as unknown);
}
