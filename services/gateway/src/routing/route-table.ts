/** Services the gateway forwards to. Each owns its own database (ADR-0001). */
export const UPSTREAM_SERVICES = [
  'identity',
  'shipping',
  'orders',
  'payments',
  'notifications',
  'integrations',
] as const;
export type UpstreamService = (typeof UPSTREAM_SERVICES)[number];

export interface Route {
  /** Public path prefix, kept as is when forwarded. */
  readonly prefix: string;
  readonly service: UpstreamService;
}

/**
 * Public routes by path prefix. A new controller prefix in a service needs one line here.
 * `/internal/*` (service-to-service, ADR-0004) is deliberately absent: the gateway never exposes it.
 */
export const ROUTES: readonly Route[] = [
  { prefix: '/auth', service: 'identity' },
  { prefix: '/.well-known', service: 'identity' },
  { prefix: '/stores', service: 'identity' },
  { prefix: '/invitations', service: 'identity' },
  { prefix: '/audit', service: 'identity' },
  { prefix: '/geo', service: 'shipping' },
  { prefix: '/pricing', service: 'shipping' },
  { prefix: '/carriers', service: 'shipping' },
  { prefix: '/tracking', service: 'shipping' },
  { prefix: '/public/tracking', service: 'shipping' },
  { prefix: '/returns', service: 'shipping' },
  { prefix: '/delivery-requests', service: 'shipping' },
  // `/webhooks/:carrier/:storeId`; the more specific webhook prefixes below win.
  { prefix: '/webhooks', service: 'shipping' },
  { prefix: '/orders', service: 'orders' },
  { prefix: '/confirmation', service: 'orders' },
  { prefix: '/blacklist', service: 'orders' },
  { prefix: '/public/confirm', service: 'orders' },
  { prefix: '/public/forms', service: 'orders' },
  { prefix: '/money', service: 'payments' },
  { prefix: '/payouts', service: 'payments' },
  { prefix: '/notifications', service: 'notifications' },
  { prefix: '/webhooks/messages', service: 'notifications' },
  { prefix: '/integrations', service: 'integrations' },
  { prefix: '/webhooks/shops', service: 'integrations' },
];
