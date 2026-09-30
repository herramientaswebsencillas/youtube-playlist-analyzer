/** @type {import('next').NextConfig} */

// Exportación estática compatible con GitHub Pages.
// El sitio se publica en un subdirectorio (https://usuario.github.io/repo), por eso
// basePath/assetPrefix llevan el nombre del repositorio. Ajústalos si cambia.
const nextConfig = {
  output: 'export',
  basePath: '/youtube-playlist-analyzer',
  assetPrefix: '/youtube-playlist-analyzer/',
  trailingSlash: true,
  images: {
    // Requerido para `output: 'export'`: desactiva la optimización de imágenes en servidor.
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
