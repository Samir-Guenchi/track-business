/** The gateway: the only API the browser talks to (ADR-0001). */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
