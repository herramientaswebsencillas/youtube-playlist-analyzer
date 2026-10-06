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

El workflow `.github/workflows/nextjs.yml` verifica el proyecto (tipos, lint,
pruebas unitarias, `npm audit`, build y pruebas E2E) en cada pull request y en
cada push a `main`. Solo si la
verificación pasa, compila y publica el sitio en GitHub Pages. Define los
valores en **Settings → Secrets and variables → Actions**:

- `NEXT_PUBLIC_YOUTUBE_API_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

Además, `.github/workflows/codeql.yml` ejecuta análisis de seguridad con CodeQL
y `.github/dependabot.yml` propone actualizaciones mensuales de dependencias.

### Configuración recomendada de la clave en Google Cloud

Como la clave es pública, su protección real está en Google Cloud Console
(*APIs y servicios → Credenciales* y *Cuotas*):

1. **Restricción de aplicación → Referentes HTTP:** solo
   `https://herramientaswebsencillas.github.io/*` (y `http://localhost:3000/*`
   en una clave aparte para desarrollo).
2. **Restricción de API:** solo *YouTube Data API v3*.
3. **Cuotas:** además del límite diario, fija un límite de consultas *por
   minuto por usuario* y crea una alerta de consumo en Cloud Monitoring.

La restricción por referente frena el uso desde otros sitios web, pero un
cliente fuera del navegador puede falsificar esa cabecera. Por eso los límites
de cuota son la segunda barrera.

## Operación

**Rotar la clave de la API** (si se filtra o se detecta abuso):

1. En Google Cloud Console, crea una clave nueva con las restricciones de
   arriba.
2. Actualiza el secret `NEXT_PUBLIC_YOUTUBE_API_KEY` en GitHub.
3. Vuelve a ejecutar el workflow (*Actions → CI / Deploy to Pages → Run
   workflow*) y comprueba el sitio.
4. Elimina la clave anterior.

**Cuota agotada (`quota-exceeded`):** la cuota se reinicia a medianoche, hora
del Pacífico. Mientras tanto, el historial local sigue funcionando. Si ocurre a
menudo, revisa en *Cuotas* si el consumo viene de un abuso y considera bajar
el límite por minuto.

**Volver a una versión anterior:** revierte el commit problemático con
`git revert` y haz push a `main`; el workflow redepliega automáticamente. En
una emergencia, también puedes volver a ejecutar desde *Actions* el
workflow de un commit anterior.

## Estructura

```
src/
├─ app/                 # Layout, página principal, "Acerca de", "Privacidad" y estilos
├─ components/          # Componentes de interfaz
├─ store/               # Estado global (Zustand)
├─ types/               # Tipos del dominio
└─ lib/
   ├─ youtube/          # Parseo de entrada y cliente de la API
   ├─ analysis/         # Normalización, artista, duplicados y orquestación
   ├─ export/           # Exportación / importación (JSON)
   ├─ captcha/          # Verificación reCAPTCHA (anti-bots)
   ├─ storage/          # Caché e historial en LocalStorage
   ├─ testing/          # Datos de prueba compartidos por los tests
   └─ utils/            # Validación de URLs externas
```

La lógica de negocio (normalización, extracción de artista, detección de
duplicados, clasificación de disponibilidad e import/export) vive en `src/lib` y
es independiente de la interfaz, de modo que puede evolucionar sin afectar la UI.

## Desarrollo

Requiere Node.js 22 o superior (la versión exacta está en `.nvmrc`).

```bash
npm ci             # instala las dependencias exactas del lockfile
npm run dev        # entorno de desarrollo
npm run build      # exportación estática a ./out
npm run typecheck  # verificación de tipos
npm run lint       # ESLint
npm test           # pruebas unitarias (Vitest)
npm run test:e2e   # pruebas E2E (Playwright) sobre ./out; requiere build
```

Las pruebas unitarias viven junto al código (`src/**/*.test.ts`) y cubren la
lógica de `src/lib` (parseo de URLs, normalización, duplicados, importación,
historial y el cliente de la API con `fetch` simulado) y el store.

Las pruebas E2E (`e2e/`) sirven la exportación estática con el mismo basePath
que GitHub Pages (`e2e/serve.mjs`) y recorren importar → ver resultados →
exportar → historial con la CSP de producción activa. No usan la API. La
primera vez, instala el navegador con `npx playwright install chromium`.

Para contribuir, consulta [CONTRIBUTING.md](CONTRIBUTING.md). Para reportar
vulnerabilidades, [SECURITY.md](SECURITY.md).

## Privacidad

La aplicación no tiene servidor ni analítica: los análisis se guardan solo en
el LocalStorage del navegador. Los servicios de terceros (YouTube Data API y
Google reCAPTCHA) se describen en la página
[«Privacidad»](https://herramientaswebsencillas.github.io/youtube-playlist-analyzer/privacidad/).

## Licencia

Proyecto open source bajo licencia [MIT](LICENSE). El código está disponible en
[GitHub](https://github.com/herramientaswebsencillas/youtube-playlist-analyzer);
las contribuciones, reportes de errores y forks son bienvenidos.
