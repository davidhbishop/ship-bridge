import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ship Bridge',
    short_name: 'Bridge',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b131c',
    theme_color: '#0b131c',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
