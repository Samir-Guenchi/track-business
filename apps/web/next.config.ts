import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@trackecom/ui'],
  /**
   * Only the customer's order form (/<locale>/f/<key>, #134) may sit in another site's iframe;
   * every other page refuses framing so it cannot be clickjacked.
   */
  headers: async () => [
    {
      source: '/:path((?!(?:ar|fr|en)/f/).*)',
      headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }],
    },
  ],
};

export default withNextIntl(nextConfig);
