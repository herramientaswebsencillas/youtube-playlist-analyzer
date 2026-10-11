# 0005. Exportar e importar solo en JSON

- **Estado:** Aceptada
- **Fecha:** 2026-06-23 (commit `55a692b`; registrada el 2026-10-11)

## Contexto

Al principio el análisis se exportaba también en CSV y HTML. Esos formatos
eran parciales y no se podían reimportar, así que no servían como respaldo
ni para recuperar títulos.

## Decisión

Se exporta e importa un único formato: JSON con `schemaVersion`
(`src/lib/export/json.ts`). La importación acepta exportaciones antiguas y
rellena los campos que falten.

## Alternativas descartadas

- **Mantener CSV y HTML como formatos de lectura:** duplicaban código y
  confundían, porque parecían respaldos y no lo eran.

## Consecuencias

- El JSON exportado es un contrato con quien lo guarda: un cambio
  incompatible en su forma requiere subir `schemaVersion` y mantener la
  lectura de las versiones anteriores.
- Quien quiera una hoja de cálculo debe convertir el JSON por su cuenta.
