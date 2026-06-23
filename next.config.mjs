/** @type {import('next').NextConfig} */

// Exportación estática compatible con GitHub Pages.
// Si el sitio se publica en un subdirectorio (p. ej. https://usuario.github.io/repo),
// descomenta y ajusta basePath/assetPrefix con el nombre del repositorio.
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
