# YouTube Playlist Analyzer

Aplicación web estática (Next.js + TypeScript + Tailwind) que analiza playlists
públicas de **YouTube** y **YouTube Music** para detectar:

- **Canciones duplicadas**, agrupadas por título y artista normalizados (no solo
  por título), de modo que la misma pista escrita de formas distintas se detecta
  como un único grupo.
- **Videos eliminados, privados o no disponibles**, incluyendo los que en la
  playlist solo aparecen como «Deleted video» o «Private video».

Todo el procesamiento ocurre **en el navegador**, usando exclusivamente la
YouTube Data API v3 y el LocalStorage. No hay backend, base de datos ni
servicios intermedios. El proyecto está preparado para exportación estática
(`output: 'export'`) y despliegue en GitHub Pages.

🔗 **Demo:** https://herramientaswebsencillas.github.io/youtube-playlist-analyzer/
ℹ️ **Más información:** ver la página [«Acerca de»](https://herramientaswebsencillas.github.io/youtube-playlist-analyzer/acerca-de/) del sitio.

## Funcionalidades

- **Detección de duplicados** por clave compuesta de título + artista
  normalizados, con extracción automática del artista a partir del título, el
  canal y la descripción del video.
- **Clasificación de disponibilidad**: disponible, eliminado, privado o no
  disponible.
- **Recuperación de títulos**: si una playlist se analizó antes, los videos que
  ahora figuran como eliminados/privados conservan el título que tenían en el
  análisis previo (tomado de la caché local o de un archivo importado).
- **Historial local**: cada análisis se guarda automáticamente en el navegador
  para volver a consultarlo sin gastar cuota de la API.
- **Exportar / importar (JSON)**: el análisis completo se descarga como JSON y
  puede reimportarse. Es a la vez respaldo y fuente para recuperar títulos de
  videos que desaparezcan más adelante. _(Los antiguos formatos CSV y HTML, que
  eran de solo lectura y no reimportables, se retiraron para homologar
  exportación e importación.)_
- **Verificación anti-bots (reCAPTCHA)**: cada llamada real a la API pasa primero
  por un reto reCAPTCHA invisible para disuadir el uso automatizado.

## Configuración

Variables de entorno (ver `.env.local.example`):

```
NEXT_PUBLIC_YOUTUBE_API_KEY=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

### `NEXT_PUBLIC_YOUTUBE_API_KEY` (requerida)

Clave de la YouTube Data API v3. Al ser una app 100% client-side, la clave es
pública: restríngela en Google Cloud Console mediante *HTTP referrers* para
permitir únicamente el dominio donde publiques la aplicación.

### `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (opcional pero recomendada)

Site key pública de **Google reCAPTCHA v2** en modo *invisible*. Antepone un reto
a cada consulta a la API para evitar el consumo automatizado de la cuota:

> El reto es normalmente invisible y solo aparece ante actividad sospechosa.
> Los resultados leídos desde el historial local **no** disparan la verificación,
> ya que no consultan la API.
>
> **Nota:** al no existir backend, el token de reCAPTCHA no se verifica en
> servidor. La barrera efectiva es la interacción humana que el reto exige; no es
> una validación criptográfica del lado del servidor. Si la variable se deja
> vacía, la verificación se omite (cómodo para desarrollo local).

## Despliegue

El repositorio incluye un workflow de GitHub Actions (`.github/workflows`) que
compila y publica el sitio en GitHub Pages. Define los valores en
**Settings → Secrets and variables → Actions**:

- `NEXT_PUBLIC_YOUTUBE_API_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

## Estructura

```
src/
├─ app/                 # Layout, página principal, "Acerca de" y estilos globales
├─ components/          # Componentes de interfaz
├─ store/               # Estado global (Zustand)
├─ types/               # Tipos del dominio
└─ lib/
   ├─ youtube/          # Parseo de entrada y cliente de la API
   ├─ analysis/         # Normalización, artista, duplicados y orquestación
   ├─ export/           # Exportación / importación (JSON)
   ├─ captcha/          # Verificación reCAPTCHA (anti-bots)
   ├─ storage/          # Caché e historial en LocalStorage
   └─ utils/            # Saneamiento / escape
```

La lógica de negocio (normalización, extracción de artista, detección de
duplicados, clasificación de disponibilidad e import/export) vive en `src/lib` y
es independiente de la interfaz, de modo que puede evolucionar sin afectar la UI.

## Desarrollo

```bash
npm install
npm run dev        # entorno de desarrollo
npm run build      # exportación estática a ./out
npm run typecheck  # verificación de tipos
```

## Licencia

Proyecto open source. El código está disponible en
[GitHub](https://github.com/herramientaswebsencillas/youtube-playlist-analyzer);
las contribuciones, reportes de errores y forks son bienvenidos.
