import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

// Module-level cache so every request after the first uses the stored token
let tokenPromise: Promise<string | null> | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 4 * 60 * 1000; // refresh every 4 minutes

function getToken(): Promise<string | null> {
  const now = Date.now();

  // 1. If non-HttpOnly cookie is present, use it directly
  const cookie = getCookie('CF_Authorization');
  if (cookie) return Promise.resolve(cookie);

  // 2. Otherwise call the Cloudflare Access identity endpoint (same-origin, cookie sent automatically)
  if (!tokenPromise || now - tokenFetchedAt > TOKEN_TTL_MS) {
    tokenFetchedAt = now;
    tokenPromise = fetch('/cdn-cgi/access/get-identity', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { jwt?: string } | null) => data?.jwt ?? null)
      .catch(() => null);
  }
  return tokenPromise;
}

/**
 * Cloudflare Zero Trust sets CF_Authorization (HttpOnly).
 * For SPAs, CF Access exposes /cdn-cgi/access/get-identity which returns
 * the JWT that can be forwarded as a Bearer token to the API.
 */
export const cfJwtInterceptor: HttpInterceptorFn = (req, next) =>
  from(getToken()).pipe(
    switchMap(token => {
      if (token) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
      return next(req);
    })
  );

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
