# Auditoría del proyecto: youtube-playlist-analyzer

**Fecha:** 2026-09-29 · **Commit auditado:** `abaa07a` (main) · **Auditor:** Claude (skill auditoria-proyecto-software)

## 1. Resumen ejecutivo

Aplicación web 100 % client-side (Next.js 14 con `output: 'export'`, TypeScript, Tailwind y Zustand) que analiza playlists públicas de YouTube/YouTube Music con la YouTube Data API v3 y guarda resultados en `localStorage`. Se publica en GitHub Pages mediante GitHub Actions. No tiene backend, cuentas de usuario ni base de datos, por lo que la superficie de ataque es pequeña y 28 de los 72 controles no aplican. El código está bien estructurado y la validación de entradas y URLs es cuidadosa. Los riesgos reales son una clave de Google API que quedó en el historial de Git, un framework fuera de soporte, una protección anti-abuso de cuota que solo existe en el cliente y la ausencia total de pruebas y de verificaciones en el pipeline.

**Calificación global:** 52 % — Requiere atención
**Hallazgos:** 0 críticos · 1 alto · 6 medios · 5 bajos · 2 informativos
**Controles no verificables desde el código:** 6 de 72 (28 no aplican; 38 evaluados)

**Prioridades principales**
1. **H-01** Rotar o restringir la clave de YouTube API que aparece en el historial de Git (commits `1ab8944` y `8739b23`).
2. **H-03** Aplicar restricciones de API y de cuota a la clave en Google Cloud: el reCAPTCHA del cliente no impide usar la clave directamente.
3. **H-02** Migrar de Next.js 14 (fuera de soporte, 24 avisos de seguridad) a una versión mantenida.
4. **H-04 / H-05** Agregar pruebas unitarias a `src/lib` y un job de verificación (typecheck, lint, pruebas, `npm audit`) que bloquee el despliegue.
5. **H-06** Publicar un aviso de privacidad propio que cumpla las políticas para desarrolladores de YouTube API Services.

## 2. Resultados por área

| # | Área | Cumple | Parcial | No cumple | N/A | No verif. | Puntaje |
|---|------|-------:|--------:|----------:|----:|----------:|--------:|
| 01 | Fundamentos del proyecto | 0 | 1 | 1 | 1 | 0 | 25 % |
| 02 | Diseño y arquitectura | 1 | 0 | 0 | 0 | 3 | 100 % |
| 03 | Documentación | 2 | 3 | 3 | 1 | 0 | 44 % |
| 04 | Pruebas y calidad | 0 | 0 | 4 | 0 | 0 | 0 % |
| 05 | Automatización y despliegue | 0 | 2 | 1 | 1 | 0 | 33 % |
| 06 | Observabilidad y operación | 0 | 0 | 0 | 5 | 1 | — |
| 07 | Secretos y configuración | 2 | 0 | 1 | 0 | 0 | 67 % |
| 08 | Autenticación y sesiones | 0 | 0 | 0 | 6 | 0 | — |
| 09 | Base de datos y autorización | 0 | 0 | 0 | 5 | 0 | — |
| 10 | Validación y protección de datos | 2 | 1 | 0 | 3 | 0 | 83 % |
| 11 | Archivos y APIs | 0 | 2 | 0 | 2 | 0 | 50 % |
| 12 | Seguridad web | 2 | 0 | 1 | 2 | 0 | 67 % |
| 13 | Dependencias y vigilancia | 1 | 0 | 4 | 1 | 2 | 20 % |
| 14 | Cumplimiento y aspectos legales | 3 | 1 | 0 | 1 | 0 | 88 % |

El promedio global (52 %) se calcula sobre las 11 áreas con controles evaluables. El 100 % del área 02 se basa en un solo control evaluable (ARQ-04) y pesa poco como señal.

<details>
<summary>Detalle de estado por control</summary>

| Control | Estado | Nota breve |
|---------|--------|------------|
| FUN-01 | ⚠️ Parcial | Historial en Git sin binarios, pero con mensajes genéricos («Se hacen mejoras» ×2) y dos commits idénticos (`bed7564`, `e03a1a5`) |
| FUN-02 | ❌ No cumple | 8 commits directos a `main`, 0 merges, sin CODEOWNERS ni plantilla de PR |
| FUN-03 | ➖ N/A | Sitio estático en GitHub Pages; el runtime se fija en DOC-02 |
| ARQ-01 | ❓ No verificable | Sin requisitos no funcionales escritos |
| ARQ-02 | ❓ No verificable | — |
| ARQ-03 | ❓ No verificable | Riesgo bajo por la arquitectura; aun así conviene el análisis de abuso de cuota (H-03) |
| ARQ-04 | ✅ Cumple | 4 dependencias de runtime, todas ampliamente adoptadas, sin duplicados de función |
| DOC-01 | ✅ Cumple | README explica qué hace, para quién y qué no hace (sin backend) |
| DOC-02 | ⚠️ Parcial | `.env.local.example` completo; falta versión de Node (`engines`/`.nvmrc`) y `npm run lint` no funciona (H-08) |
| DOC-03 | ✅ Cumple | Sección «Estructura» en README coincide con `src/` |
| DOC-04 | ⚠️ Parcial | Decisiones clave (sin backend, reCAPTCHA sin verificación de servidor) explicadas en README y comentarios, sin ADR formales |
| DOC-05 | ➖ N/A | No expone API propia |
| DOC-06 | ❌ No cumple | El README invita a contribuir pero no hay `CONTRIBUTING.md` |
| DOC-07 | ❌ No cumple | Sin procedimiento para rotar la clave, rollback o cuota agotada |
| DOC-08 | ❌ No cumple | Sin tags, sin CHANGELOG; `version` en 1.0.0 desde el inicio |
| DOC-09 | ⚠️ Parcial | Documentación en el repo; comentario obsoleto en `sanitize.ts:4-6` y código muerto (`escapeHtml`) |
| PRU-01 | ❌ No cumple | Ninguna prueba ni framework de pruebas |
| PRU-02 | ❌ No cumple | Sin pruebas del cliente de API con `fetch` simulado |
| PRU-03 | ❌ No cumple | Sin E2E del flujo analizar / exportar / importar |
| PRU-04 | ❌ No cumple | Sin configuración de ESLint; `lint` no se ejecuta en CI |
| CI-01 | ⚠️ Parcial | Compila y despliega automáticamente, pero no verifica tipos, lint, pruebas ni vulnerabilidades |
| CI-02 | ❌ No cumple | Nada puede poner el pipeline en rojo salvo un error de build |
| CI-03 | ➖ N/A | Sin base de datos |
| CI-04 | ⚠️ Parcial | Se puede redeplegar un commit anterior, pero sin tags ni procedimiento |
| OBS-01 a OBS-04 | ➖ N/A | Sitio estático servido por GitHub Pages; sin procesos propios |
| OBS-05 | ❓ No verificable | La señal relevante es el consumo de cuota en Google Cloud Console |
| OBS-06 | ➖ N/A | No hay datos en servidor; el usuario tiene exportación JSON como respaldo |
| SEC-01 | ✅ Cumple | Sin secretos en el código actual; separación pública/servidor explícita y documentada |
| SEC-02 | ❌ No cumple | Clave `AIza…2zRk` en el historial (H-01) |
| SEC-03 | ✅ Cumple | Valores inyectados desde GitHub Secrets (`nextjs.yml:78-80`); `.env*.local` ignorado |
| AUT-01 a AUT-06 | ➖ N/A | Sin autenticación ni sesiones |
| BD-01 a BD-05 | ➖ N/A | Sin base de datos ni operaciones autorizadas |
| VAL-01 | ⚠️ Parcial | Entrada principal validada con lista blanca; la importación JSON no valida `playlistId` ni tamaño (H-10) |
| VAL-02 | ✅ Cumple | Sin `dangerouslySetInnerHTML`; `href`/`src` pasan por `safeYouTubeUrl` |
| VAL-03 a VAL-05 | ➖ N/A | Sin SQL, sin peticiones de servidor, sin datos sensibles |
| VAL-06 | ✅ Cumple | Solo datos públicos de playlists; el usuario puede borrar historial |
| API-01 | ⚠️ Parcial | Importación JSON sin límite de tamaño (H-10) |
| API-02, API-03 | ➖ N/A | Sin almacenamiento en servidor ni respuestas propias |
| API-04 | ⚠️ Parcial | reCAPTCHA solo en cliente; la clave del bundle permite saltarlo (H-03) |
| WEB-01 | ✅ Cumple | GitHub Pages sirve HTTPS; todas las llamadas son `https://` |
| WEB-02 | ❌ No cumple | Sin CSP ni otras cabeceras (H-09) |
| WEB-03, WEB-04 | ➖ N/A | Sin API propia ni cookies |
| WEB-05 | ✅ Cumple | Errores traducidos a mensajes legibles (`api.ts:51-85`), sin stack traces |
| DEP-01 | ❌ No cumple | `npm audit`: 1 crítica, 3 altas, 1 moderada; Next.js 14 fuera de soporte (H-02) |
| DEP-02 | ✅ Cumple | Versiones exactas, `package-lock.json` versionado, `npm ci` en CI |
| DEP-03 | ❌ No cumple | Sin Dependabot/Renovate ni SBOM (H-07) |
| DEP-04 | ❌ No cumple | Sin CodeQL ni escaneo de secretos (H-07) |
| DEP-05 | ➖ N/A | Sin autenticación ni operaciones privilegiadas |
| DEP-06, DEP-07 | ❓ No verificable | — |
| DEP-08 | ❌ No cumple | Sin `SECURITY.md` ni canal para reportar vulnerabilidades (H-12) |
| LEG-01 | ✅ Cumple | MIT; dependencias de runtime con licencia MIT |
| LEG-02 | ➖ N/A | La app no recoge datos personales propios (reCAPTCHA se trata en LEG-03) |
| LEG-03 | ⚠️ Parcial | Aviso de reCAPTCHA en el pie; falta aviso de privacidad propio y los requisitos de YouTube API Services (H-06) |
| LEG-04 | ✅ Cumple | Los terceros (YouTube API y reCAPTCHA, ambos de Google) se mencionan en el sitio |
| LEG-05 | ✅ Cumple | `LICENSE` MIT con titular identificado |

</details>

## 3. Hallazgos

### [H-01] Clave de YouTube Data API en el historial de Git — 🟠 Alta
- **Control:** SEC-02 · Historial de Git limpio y rotación de credenciales expuestas
- **Evidencia:** `.env.local.example` contenía `NEXT_PUBLIC_YOUTUBE_API_KEY=AIza****2zRk` (39 caracteres) en el commit `1ab8944` (2026-06-22). Se retiró en `8739b23` (2026-06-23), pero sigue siendo recuperable con `git show 1ab8944:.env.local.example`. El remoto es `github.com/herramientaswebsencillas/youtube-playlist-analyzer`, que al publicarse en GitHub Pages es previsiblemente público.
- **Riesgo:** una clave de Google sin restricción de API puede llamar a **cualquier API habilitada en su proyecto de Google Cloud**, no solo a YouTube. Si el proyecto tiene habilitadas APIs de pago (Gemini/Generative Language, Maps, etc.), un tercero podría generar cargos o agotar cuotas. Si la clave no tiene restricción de referrer, se puede usar desde cualquier origen.
- **Ajuste de severidad:** por defecto sería Crítica. Se baja a Alta porque la clave es pública por diseño (`NEXT_PUBLIC_*`, termina en el bundle del sitio), así que el historial solo añade riesgo si esa clave difiere de la de producción o si no tiene restricciones. **Si la clave sigue vigente y no tiene restricción de API, trátala como Crítica.**
- **Recomendación:**
  1. En Google Cloud Console → *APIs y servicios → Credenciales*, localiza la clave terminada en `2zRk`. Si no es la de producción, **elimínala**. Si lo es, **rótala**: crea una nueva, actualiza el secret `NEXT_PUBLIC_YOUTUBE_API_KEY` en GitHub, redespliega y borra la anterior.
  2. En la clave nueva, aplica *Restricciones de aplicación → Referentes HTTP* (`https://herramientaswebsencillas.github.io/*`) y *Restricciones de API → solo YouTube Data API v3*.
  3. Reescribir el historial (`git filter-repo`) es opcional una vez rotada la clave. Con la clave inválida ya no aporta seguridad, y reescribir obliga a hacer force-push.
- **Esfuerzo estimado:** Bajo

### [H-02] Next.js 14.2.35 fuera de soporte, con avisos de seguridad sin parche en esa rama — 🟡 Media
- **Control:** DEP-01 · Escaneo de vulnerabilidades conocidas
- **Evidencia:** `package.json:14` fija `next@14.2.35`. `npm audit` reporta 5 paquetes vulnerables (1 crítica, 3 altas, 1 moderada). Next.js acumula 24 avisos, entre ellos RCE en Image Optimization y en servidores Windows, SSRF en Server Actions y rewrites, y DoS en Server Components. `npm audit` solo ofrece la corrección `next@16.3.7`, un cambio mayor. La rama 14.x ya no recibe parches.
- **Ajuste de severidad:** por defecto sería Alta. Se baja a Media porque casi todos los avisos afectan funciones de servidor (Server Actions, Image Optimization, middleware, rewrites, caché RSC) que no existen con `output: 'export'` servido por GitHub Pages (`next.config.mjs:6`). Los dos avisos de XSS del lado del cliente requieren nonces de CSP o scripts `beforeInteractive`, y este proyecto no usa ninguno. Los avisos de `postcss`, `browserslist` y `nanoid` solo afectan al build sobre CSS propio. El riesgo real es quedarse sin parches futuros.
- **Recomendación:** migrar a Next.js 15 o 16 (y React 19) en una rama aparte. La migración debería ser acotada: no hay rutas dinámicas, API routes ni middleware. Después, `npm audit` debería quedar limpio o solo con avisos de desarrollo.
- **Esfuerzo estimado:** Medio

### [H-03] La protección anti-abuso de cuota solo existe en el cliente — 🟡 Media
- **Control:** API-04 · Rate limiting en endpoints costosos o fáciles de abusar
- **Evidencia:** `src/lib/captcha/recaptcha.ts:9-12` reconoce que el token nunca se verifica en un servidor. `src/lib/youtube/api.ts:40,92` envía la clave directamente desde el navegador, y la clave está incrustada en el JS publicado. `recaptcha.ts:149` omite el reto si falta la site key.
- **Riesgo:** cualquiera puede extraer la clave del bundle y llamar a `googleapis.com` sin pasar por el reCAPTCHA. La restricción por referrer frena a los navegadores, pero un cliente fuera del navegador puede falsificar la cabecera `Referer`. Un análisis de una playlist de 5 000 elementos cuesta unas 200 unidades, así que la cuota diaria por defecto (10 000) se agota con unas 50 peticiones grandes y el servicio deja de funcionar para todos. El README lo explica con honestidad; el hallazgo es que falta la mitigación del lado de Google.
- **Recomendación:**
  1. Aplicar las restricciones de referrer y de API de H-01.
  2. En *Cuotas* de la YouTube Data API, fijar un límite **por usuario por minuto** además del diario, y crear una alerta de consumo en Cloud Monitoring.
  3. Si el abuso se vuelve real, poner un proxy serverless mínimo (p. ej. un Cloudflare Worker) que guarde la clave como secreto, verifique el token de reCAPTCHA con `siteverify` y aplique rate limiting por IP. Con eso, además, la clave deja de ser pública.
- **Esfuerzo estimado:** Bajo (pasos 1 y 2) · Medio (paso 3)

### [H-04] Sin pruebas automatizadas sobre una lógica muy fácil de probar — 🟡 Media
- **Control:** PRU-01, PRU-02, PRU-03
- **Evidencia:** no hay archivos `*.test.*`, carpetas `__tests__/` ni `e2e/`, ni jest/vitest/playwright en `package.json`. La lógica de negocio es pura y está aislada: `src/lib/analysis/normalize.ts` (249 líneas de normalización y extracción de artista), `duplicates.ts`, `youtube/parseInput.ts` y `export/import.ts`.
- **Ajuste de severidad:** por defecto sería Alta porque hay usuarios. Queda en Media porque un fallo solo produce resultados incorrectos: no se pierden ni se exponen datos.
- **Riesgo:** un cambio en las heurísticas de normalización puede alterar sin aviso qué se marca como duplicado, y la compatibilidad de importación con exportaciones antiguas no está protegida.
- **Recomendación:** agregar Vitest y empezar por tablas de casos: `parsePlaylistInput` (URLs de music.youtube.com, `youtu.be`, hosts no permitidos, `list` inválido), `normalizeTitle` y `deriveTrackMeta` (feat., «Official Video», remasters), `findDuplicates` y `parseImportedAnalysis` (con un JSON de ejemplo de `schemaVersion: 1` como fixture). Después, una prueba de `analyzePlaylist` con `fetch` simulado y, opcionalmente, un E2E con Playwright del flujo importar → ver resultados, que no gasta cuota.
- **Esfuerzo estimado:** Medio

### [H-05] El pipeline despliega sin verificar nada — 🟡 Media
- **Control:** CI-01, CI-02
- **Evidencia:** `.github/workflows/nextjs.yml` solo instala (línea 74), compila (línea 77) y publica (líneas 82 y 96), en cada push a `main` (líneas 9-10). No ejecuta `npm run typecheck`, lint, pruebas ni `npm audit`. Además usa `node-version: "20"` (línea 54), una versión que llegó al fin de vida en abril de 2026.
- **Ajuste de severidad:** por defecto sería Alta. Queda en Media porque `next build` ya detecta errores de tipos y de compilación, y el daño de un despliegue defectuoso está acotado a un sitio estático.
- **Recomendación:** agregar un job `verify` con `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` y `npm audit --omit=dev --audit-level=high`, y hacer que `build` dependa de él (`needs: verify`). Ejecutar `verify` también en `pull_request`. Subir Node a 22 o 24 LTS y declarar la misma versión en `package.json` (`"engines"`) y en `.nvmrc`.
- **Esfuerzo estimado:** Bajo

### [H-06] Falta un aviso de privacidad propio y los requisitos de YouTube API Services — 🟡 Media
- **Control:** LEG-03 · Aviso de privacidad y términos alineados con el comportamiento real
- **Evidencia:** `src/components/AnalyzerApp.tsx:105-125` enlaza la privacidad y los términos de Google solo en relación con reCAPTCHA. No existe una página de privacidad propia. `src/app/acerca-de/page.tsx` dice que la app «se conecta únicamente en modo lectura a YouTube», pero también carga `https://www.google.com/recaptcha/api.js` (`recaptcha.ts:19`) y guarda datos en `localStorage`.
- **Riesgo:** las políticas para desarrolladores de YouTube API Services exigen que los clientes de la API tengan una política de privacidad propia, que informen del uso de YouTube API Services y que enlacen a los Términos de servicio de YouTube y a la Política de privacidad de Google. Si no se cumplen, Google puede revocar el acceso a la API. reCAPTCHA recoge datos del dispositivo del visitante, lo que puede requerir aviso según la jurisdicción de los usuarios (GDPR, LFPDPPP).
- **Recomendación:** crear `src/app/privacidad/page.tsx` que explique qué guarda la app (solo en `localStorage` del navegador y cómo borrarlo), qué terceros intervienen (YouTube API Services y Google reCAPTCHA) y que enlace a <https://www.youtube.com/t/terms> y <https://policies.google.com/privacy>. Enlazarla desde el pie y desde «Acerca de», y corregir la frase «únicamente… a YouTube». **Revisar el texto con un especialista:** esta auditoría no es asesoría legal.
- **Esfuerzo estimado:** Bajo

### [H-07] Sin análisis de seguridad automatizado ni actualizaciones automáticas — 🟡 Media
- **Control:** DEP-04, DEP-03
- **Evidencia:** no existen `.github/dependabot.yml`, `renovate.json`, workflows de CodeQL ni de escaneo de secretos.
- **Riesgo:** un escáner de secretos como gitleaks habría detectado H-01 en el primer commit, y Dependabot habría avisado del atraso de Next.js (H-02).
- **Recomendación:** en *Settings → Code security* del repositorio, activar Dependabot alerts, Dependabot security updates, secret scanning con push protection y CodeQL con la configuración por defecto (son gratis en repositorios públicos). Agregar `.github/dependabot.yml` con actualizaciones mensuales para `npm` y `github-actions`. El SBOM es opcional en un proyecto de este tamaño.
- **Esfuerzo estimado:** Bajo

### [H-08] El script `lint` no tiene configuración y no se ejecuta — 🔵 Baja
- **Control:** PRU-04 · Linter y formateador aplicados desde el pipeline
- **Evidencia:** `package.json:10` define `"lint": "next lint"`, pero no existe `.eslintrc*` ni `eslint.config.*`, ni `eslint` y `eslint-config-next` en `devDependencies`. En Next 14, `next lint` sin configuración abre un asistente interactivo. `src/components/VideoItem.tsx:26` desactiva una regla (`@next/next/no-img-element`) que nunca se evalúa.
- **Recomendación:** agregar `eslint` y `eslint-config-next` con un `.eslintrc.json` (`{"extends": "next/core-web-vitals"}`), o en la migración de H-02 usar el CLI de ESLint directamente (Next 16 retiró `next lint`). Opcionalmente, Prettier. Ejecutarlo en el job de H-05.
- **Esfuerzo estimado:** Bajo

### [H-09] Sin Content-Security-Policy ni otras cabeceras de seguridad — 🔵 Baja
- **Control:** WEB-02 · Cabeceras de seguridad
- **Evidencia:** no hay `<meta http-equiv="Content-Security-Policy">` en `src/app/layout.tsx`, y GitHub Pages no permite configurar cabeceras HTTP.
- **Ajuste de severidad:** por defecto sería Media. Se baja a Baja porque el sitio no tiene sesiones ni datos privados que robar, React escapa todo el contenido de terceros y las URLs pasan por lista blanca.
- **Recomendación:** agregar una CSP mediante `<meta>` en `layout.tsx` como defensa en profundidad, por ejemplo `default-src 'self'; connect-src 'self' https://www.googleapis.com; img-src 'self' https://i.ytimg.com https://*.ggpht.com; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com; frame-src https://www.google.com`. El export estático de Next emite scripts inline, así que hay que probarla antes de desplegar. `frame-ancestors` no funciona en `<meta>`: la protección contra framing requeriría migrar a un host que permita cabeceras (Cloudflare Pages, Netlify).
- **Esfuerzo estimado:** Bajo

### [H-10] La importación JSON no limita el tamaño ni valida el ID, y los fallos de guardado son silenciosos — 🔵 Baja
- **Control:** VAL-01, API-01
- **Evidencia:**
  - `src/components/ImportButton.tsx:21` lee el archivo completo con `file.text()` sin comprobar `file.size`.
  - `src/lib/export/import.ts:44-48` acepta cualquier cadena como `playlistId`, sin usar `isPlaylistId`. Ese valor se usa como clave de `localStorage` y en «Actualizar» se envía a la API.
  - `src/lib/storage/history.ts:33-41` devuelve `false` cuando se llena `localStorage` (unos 5 MB), pero `saveAnalysis` (línea 71) ignora ese resultado. Algunas playlists grandes bastan para llenar el espacio, y a partir de ahí los análisis dejan de guardarse sin avisar.
- **Riesgo:** afecta sobre todo a la funcionalidad. Un archivo enorme congela la pestaña, y un usuario puede creer que su historial, que también sirve para recuperar títulos, está guardado cuando no lo está.
- **Recomendación:** rechazar archivos de más de 20 MB antes de leerlos; validar `playlistId` con `isPlaylistId` en `parseInfo`; hacer que `saveAnalysis` devuelva un booleano y mostrar un aviso («no se pudo guardar en el navegador; exporta el JSON») cuando falle.
- **Esfuerzo estimado:** Bajo

### [H-11] Commits directos a `main` sin revisión y con mensajes genéricos — 🔵 Baja
- **Control:** FUN-01, FUN-02
- **Evidencia:** `git log`: 8 commits, 1 autor, 0 merges. `abaa07a` y `55a692b` se titulan «Se hacen mejoras…». `bed7564` y `e03a1a5` tienen el mismo mensaje. Cada push a `main` despliega a producción (`nextjs.yml:9-10`).
- **Recomendación:** con un solo autor no hace falta revisión de otra persona, pero sí conviene trabajar en ramas con PR para que el job `verify` de H-05 actúe antes del merge, y proteger `main` exigiendo ese check. Escribir commits que digan qué cambió y por qué (Conventional Commits es opcional).
- **Esfuerzo estimado:** Bajo

### [H-12] Documentación operativa y de proyecto incompleta — 🔵 Baja
- **Control:** DOC-02, DOC-06, DOC-07, DOC-08, DOC-09, DEP-08
- **Evidencia:**
  - Ni `engines` ni `.nvmrc` fijan la versión de Node.
  - No existen `CONTRIBUTING.md` ni `SECURITY.md`, aunque el README invita a contribuir.
  - No hay tags, releases ni CHANGELOG.
  - `src/lib/utils/sanitize.ts:4-6` habla de «export HTML/CSV», que ya se retiró, y `escapeHtml` (línea 21) no se usa en ningún archivo.
  - No hay instrucciones para rotar la clave ni para actuar si se agota la cuota.
- **Recomendación:** agregar `SECURITY.md` con un canal privado de reporte (por ejemplo GitHub Private Vulnerability Reporting), un `CONTRIBUTING.md` corto (ramas, `npm run typecheck`/`test` antes del PR), una sección «Operación» en el README (rotar la clave, qué hacer ante `quota-exceeded`, cómo redeplegar una versión anterior), y tags `vX.Y.Z` con releases de GitHub. Borrar `escapeHtml` y actualizar el comentario.
- **Esfuerzo estimado:** Bajo

### [H-13] Análisis concurrentes pueden mostrar un resultado que no corresponde — ⚪ Informativa
- **Control:** fuera del checklist (calidad funcional)
- **Evidencia:** `PlaylistInput.tsx:39` desactiva «Analizar» durante la carga, pero los botones «Abrir» y «Actualizar» de `HistoryPanel.tsx:73-93` no se desactivan. `runAnalysis` (`useAnalysisStore.ts:50-93`) no descarta respuestas obsoletas: si hay dos análisis en curso, el último que termina sobrescribe `result`, y cancelar el reCAPTCHA pendiente (`recaptcha.ts:158`) muestra por un instante el error «Verificación cancelada».
- **Recomendación:** guardar un contador o ID de petición en el store e ignorar las respuestas que no correspondan a la petición más reciente, o desactivar las acciones del historial mientras `status === 'loading'`.

### [H-14] Buenas prácticas que conviene conservar — ⚪ Informativa
- Validación de la entrada con lista blanca de hosts y expresión regular del ID (`parseInput.ts:8-20`).
- `safeYouTubeUrl` (`sanitize.ts:34-47`) filtra por protocolo y host todo `href` y `src` que viene de la API o de un archivo importado, lo que cierra el vector `javascript:` que React 18 aún permite. No se usa `dangerouslySetInnerHTML`.
- Importación defensiva, campo por campo, con recálculo de duplicados en lugar de confiar en el archivo.
- Dependencias con versión exacta, `npm ci`, permisos mínimos en el workflow (`contents: read`) y los valores inyectados desde GitHub Secrets.
- `tsconfig` estricto con `noUncheckedIndexedAccess`.
- README y código documentan con honestidad las limitaciones del reCAPTCHA sin backend.

## 4. Preguntas para el equipo

| Control | Pregunta |
|---------|----------|
| SEC-02 | ¿La clave terminada en `2zRk` es la misma que usa producción? ¿Sigue activa? ¿Qué APIs tiene habilitadas su proyecto de Google Cloud y tiene facturación? |
| API-04 / OBS-05 | ¿La clave actual tiene restricción de referrer y de API? ¿Hay cuota por minuto y alertas de consumo en Cloud Monitoring? ¿Cómo se enteran de que la cuota se agotó? |
| FUN-02 | ¿`main` tiene reglas de protección en GitHub? |
| WEB-01 | ¿Está activada la opción «Enforce HTTPS» en la configuración de GitHub Pages? |
| ARQ-01 | ¿Hay un objetivo de uso (análisis diarios esperados) que permita dimensionar la cuota o justificar el proxy de H-03? |
| ARQ-03 | Además del abuso de cuota, ¿se analizó otro escenario de abuso, como que el sitio se incruste en un iframe de otro dominio? |
| DEP-06 | ¿Quién recibe y atiende las alertas de Dependabot y los reportes de seguridad? |
| DEP-07 | ¿Se ha hecho alguna prueba DAST (p. ej. OWASP ZAP baseline) sobre el sitio publicado? |

## 5. Plan de remediación

**Inmediato (antes del próximo despliegue):**
- H-01: verificar la clave `…2zRk` y rotarla o eliminarla; restringir por referrer y por API.
- H-03 (pasos 1 y 2): cuota por minuto y alerta de consumo en Google Cloud.

**Corto plazo (próximas 2 a 4 semanas):**
- H-07: activar Dependabot, secret scanning y CodeQL (unos 15 minutos desde la configuración del repo).
- H-05 + H-08: job `verify` en CI, configuración de ESLint y Node 22/24.
- H-04: Vitest con pruebas de `parseInput`, `normalize`, `duplicates` e `import`.
- H-06: página de privacidad y enlaces requeridos por YouTube API Services.

**Mediano plazo:**
- H-02: migrar a Next.js 15/16 y React 19 (con las pruebas de H-04 ya en su lugar).
- H-10 y H-13: robustez de importación, avisos de guardado y concurrencia.
- H-09: CSP por `<meta>`.
- H-11 y H-12: trabajo con PR, `SECURITY.md`, `CONTRIBUTING.md`, sección de operación, tags y limpieza de código muerto.
- H-03 (paso 3): proxy serverless si el abuso de cuota se materializa.

## 6. Alcance y limitaciones

- **Revisado completo:** todo `src/` (29 archivos, unas 2 800 líneas), `package.json`, `package-lock.json` (vía `npm audit`), `next.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.local.example`, `.github/workflows/nextjs.yml`, `README.md`, `LICENSE` y el historial completo de Git (8 commits). El repositorio es pequeño, así que no se muestreó.
- **No revisado:** la configuración de Google Cloud (restricciones y cuotas de la clave), la configuración del repositorio en GitHub (protección de ramas, Pages, secrets), el sitio publicado en ejecución y las políticas vigentes de YouTube API Services (se citan de forma general y hay que confirmarlas en la fuente).
- **Comandos ejecutados:** script de inventario de la skill, `git log` (incluida la búsqueda de patrones `AIza…` en todo el historial, con valores enmascarados), `npm audit` y `npm audit --omit=dev` (solo lectura), además de búsquedas con grep en el código.
- **No se modificó ningún archivo** del proyecto salvo la creación de este informe.
- Esta auditoría es un análisis estático del repositorio y no sustituye pruebas de penetración ni asesoría legal.

## 7. Seguimiento de remediación (2026-09-29)

Cambios aplicados en el árbol de trabajo (sin commit), sobre `abaa07a`:

| Hallazgo | Estado | Qué se hizo / qué falta |
|----------|--------|-------------------------|
| H-01 | ✅ Resuelto | Confirmado por el responsable (2026-09-29): la clave `…2zRk` ya no existe en Google Cloud porque se rotó antes de la auditoría. Ya no hace falta reescribir el historial. El procedimiento de rotación quedó en README → «Operación». |
| H-02 | ✅ Resuelto | Next.js 16.3.7 y React 19.3.0; dependencias de desarrollo actualizadas. `npm audit`: 0 vulnerabilidades. |
| H-03 | ⚠️ Parcial | Confirmado por el responsable (2026-09-30): la clave ya tiene restricción por referente HTTP y solo permite YouTube Data API v3. Falta la cuota por minuto por usuario; la alerta de consumo es opcional, porque requiere facturación y cuesta unos USD 0.37 al mes. Configuración documentada en el README. |
| H-04 | ✅ Resuelto | Vitest con 86 pruebas: `parseInput`, `normalize`, `duplicates`, `import`, `sanitize`, `history` y `analyzePlaylist` con `fetch` simulado. No hay E2E. |
| H-05 | ✅ Resuelto | Job `verify` (typecheck, lint, pruebas, `npm audit`) en PR y push; el despliegue depende de él. Node 24 desde `.nvmrc`, `engines` ≥ 22. Falta exigir el check en la protección de rama. |
| H-06 | ✅ Resuelto* | Página `/privacidad`, enlaces a los Términos de YouTube y a la Política de privacidad de Google en el pie, y corrección del texto de «Acerca de». *Conviene revisarlo con un especialista. |
| H-07 | ✅ Resuelto en el repo | `codeql.yml` (JS/TS y Actions) y `dependabot.yml`. Falta activar secret scanning y push protection en Settings. |
| H-08 | ✅ Resuelto | ESLint 9 con `eslint-config-next` (flat config); `npm run lint` pasa sin avisos. |
| H-09 | ✅ Resuelto (con límite) | CSP por `<meta>` solo en producción, probada en el navegador: sin violaciones al cargar ni al consultar la API. `frame-ancestors` sigue sin ser posible en GitHub Pages. |
| H-10 | ✅ Resuelto | Límite de 20 MB al importar, validación de `playlistId` y aviso visible cuando LocalStorage no puede guardar. |
| H-11 | ⏳ Pendiente (proceso) | Depende de trabajar con PR y proteger `main` en GitHub. |
| H-12 | ✅ Resuelto (salvo versiones) | `SECURITY.md`, `CONTRIBUTING.md`, sección «Operación» en el README, `.nvmrc`, `escapeHtml` eliminado y comentarios corregidos. Tags y CHANGELOG quedan para la próxima versión publicada. |
| H-13 | ✅ Resuelto | El store ignora respuestas de análisis que ya no corresponden a la última acción del usuario. |

**Cambio adicional:** una clave de API inválida (HTTP 400 «API key not valid») ahora se traduce al mensaje `forbidden` en español, en lugar de mostrar el texto crudo de Google.

**Verificación:** `npm run typecheck`, `npm run lint`, `npm test` (86/86), `npm audit` (0) y `npm run build` pasan. El sitio exportado se probó en un servidor local con la CSP activa: navegación, página de privacidad y llamadas a `googleapis.com`. El reto de reCAPTCHA no se pudo completar en el navegador integrado, ni con CSP ni sin ella (limitación del entorno). **Prueba un análisis real en el sitio publicado después del despliegue.**

**Observación:** con Next 16, el prefetch por segmentos del export estático pide `__next.<ruta>.__PAGE__.txt` y recibe 404 (el archivo se genera como `__next.<ruta>/__PAGE__.txt`). Next recurre a `index.txt` y la navegación funciona; solo genera ruido en la consola.
