import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrackEcom',
    short_name: 'TrackEcom',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6eee1',
    theme_color: '#16523f',
    icons: [
      { src: '/brand/trackecom-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/trackecom-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
