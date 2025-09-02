declare module '@auth0/nextjs-auth0/edge' {
  import type { NextMiddleware } from 'next/server';
  export function withMiddlewareAuthRequired(): NextMiddleware;
}
