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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
