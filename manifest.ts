import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kabul London Surveyor Portal',
    short_name: 'KL Surveyor',
    description: 'Mobile surveyor operations app for Kabul London Ltd.',
    start_url: '/login',
    display: 'standalone',
    background_color: '#eef2f6',
    theme_color: '#146c63',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
