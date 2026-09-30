# Guía de contribución

¡Gracias por tu interés en mejorar YouTube Playlist Analyzer!

## Preparar el entorno

1. Usa la versión de Node indicada en `.nvmrc` (`nvm use`).
2. Instala dependencias con `npm ci`.
3. Copia `.env.local.example` a `.env.local` y define al menos
   `NEXT_PUBLIC_YOUTUBE_API_KEY` (una clave propia, restringida a
   `localhost`). La site key de reCAPTCHA puede quedar vacía en desarrollo.
4. Arranca con `npm run dev`.

## Flujo de trabajo

- `main` siempre está desplegada: cada merge publica el sitio.
- Trabaja en una rama (`feat/...`, `fix/...`, `docs/...`) y abre un pull
  request hacia `main`.
- El pipeline ejecuta tipos, lint, pruebas y auditoría de dependencias. Un PR
  solo se integra con todos los checks en verde.

## Antes de abrir el PR

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

- Agrega o actualiza pruebas cuando cambies la lógica de `src/lib` (por
  ejemplo, heurísticas de normalización o el formato de importación).
- Si cambias variables de entorno, comandos o comportamiento visible,
  actualiza el README, `.env.local.example` o el aviso de privacidad en el
  mismo PR.
- Nunca subas claves reales: `.env.local` está en `.gitignore` y solo se
  versiona la plantilla vacía.

## Mensajes de commit

Explica qué cambia y por qué, en una línea clara (por ejemplo, «Detecta
duplicados aunque el título incluya "(Remastered 2011)"»). Evita mensajes
genéricos como «mejoras» o «cambios».

## Reportes de seguridad

No los publiques como issue: sigue [SECURITY.md](SECURITY.md).
