import { Auth0Client } from '@auth0/nextjs-auth0/server';

const issuer = process.env.AUTH0_ISSUER_BASE_URL;
const derivedDomain = issuer ? issuer.replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined;

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || derivedDomain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
  // Explicit authorization params to request API audience
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
  },
});
