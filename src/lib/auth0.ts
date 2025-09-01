import { Auth0Client } from '@auth0/nextjs-auth0/server';
import type { NextRequest } from 'next/server';

const issuer = process.env.AUTH0_ISSUER_BASE_URL;
const derivedDomain = issuer ? issuer.replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined;

const client = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || derivedDomain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
  },
});

// Simple polyfill for protecting API handlers for App Router
function withApiAuthRequiredPolyfill<Ctx = unknown>(
  handler: (req: Request, ctx?: Ctx) => Promise<Response>
) {
  return async (req: Request, ctx?: Ctx) => {
    const session = await client.getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    return handler(req, ctx);
  };
}

export const auth0 = {
  // Sessions
  getSession: () => client.getSession(),

  // Access Token shim returning { token }
  async getAccessToken(options?: Record<string, unknown>): Promise<{ token: string }> {
    const result = await client.getAccessToken(options);
    if (!result?.token) throw new Error('Failed to obtain access token');
    return { token: result.token };
  },

  // API guard for App Router route handlers
  withApiAuthRequired: withApiAuthRequiredPolyfill,

  // Mount SDK route handler via middleware for App Router auth routes
  middleware: (req: NextRequest) => client.middleware(req),
};
