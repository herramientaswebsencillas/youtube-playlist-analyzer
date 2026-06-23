# YouTube Playlist Analyzer

Aplicación web estática (Next.js + TypeScript + Tailwind) que analiza playlists
públicas de **YouTube** y **YouTube Music** para detectar:

- Canciones duplicadas (por título normalizado).
- Videos eliminados, privados o no disponibles.

Todo el procesamiento ocurre **en el navegador**, usando exclusivamente la
YouTube Data API v3 y el LocalStorage. No hay backend, base de datos ni
servicios intermedios. El proyecto está preparado para exportación estática
(`output: 'export'`) y despliegue en GitHub Pages.

## Configuración

Una única variable de entorno (ver `.env.local.example`):

```
NEXT_PUBLIC_YOUTUBE_API_KEY=
```

Al ser una app 100% client-side, la clave es pública: restríngela en Google
Cloud Console mediante *HTTP referrers*.

## Estructura

```
src/
├─ app/                 # Layout, página y estilos globales
├─ components/          # Componentes de interfaz
├─ store/               # Estado global (Zustand)
├─ types/               # Tipos del dominio
└─ lib/
   ├─ youtube/          # Parseo de entrada y cliente de la API
   ├─ analysis/         # Normalización, duplicados y orquestación
   ├─ export/           # Exportadores CSV / JSON / HTML
   ├─ storage/          # Caché e historial en LocalStorage
   └─ utils/            # Saneamiento / escape

```

La lógica de negocio (normalización, detección de duplicados, clasificación de disponibilidad y exportación) vive en `src/lib` y es independiente de la interfaz, de modo que puede evolucionar sin afectar la UI.
