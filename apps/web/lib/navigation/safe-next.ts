/**
 * Where to go after sign-in. Only same-app paths are accepted, so a crafted
 * `?next=https://evil.example` or `//evil.example` link cannot send the seller elsewhere.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return fallback;
  }
  return next;
}
