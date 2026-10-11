# 0004. LocalStorage como caché e historial

- **Estado:** Aceptada
- **Fecha:** 2026-06-22 (commit `1ab8944`; validación defensiva en `5f49ef0`; registrada el 2026-10-11)

## Contexto

Volver a analizar una playlist gasta cuota de la API. Además, para recuperar
el título de un video que después se elimina, hace falta conservar el
análisis anterior. Sin backend ([0001](0001-app-solo-cliente.md)), el único
almacenamiento disponible es el del navegador.

## Decisión

Cada análisis se guarda en LocalStorage (`ytpa:analysis:v1:<id>`) junto con
un historial resumido (`ytpa:history:v1`), en `src/lib/storage/history.ts`.
Todo lo que se lee se reconstruye con la misma validación que un archivo
importado (`src/lib/analysis/validate.ts`), y los campos derivados (claves de
duplicados) se recalculan con las reglas actuales.

## Alternativas descartadas

- **IndexedDB:** más capacidad, pero una API más compleja para un volumen
  que normalmente cabe en LocalStorage.
- **Sin caché:** cada consulta gastaría cuota y no se podrían recuperar
  títulos.

## Consecuencias

- El origen `herramientaswebsencillas.github.io` es compartido por todos los
  sitios de la organización en GitHub Pages, así que comparten LocalStorage.
  Por eso nada de lo que se lee se trata como confiable.
- La capacidad es limitada (unos 5 MB): si no cabe, la UI avisa y sugiere
  exportar a JSON.
- Los datos no caducan solos. Está pendiente revisar esto frente a las
  políticas de YouTube API Services sobre almacenamiento de datos de la API.
