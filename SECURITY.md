# Política de seguridad

## Versiones con soporte

Solo se mantiene la versión publicada en
<https://herramientaswebsencillas.github.io/youtube-playlist-analyzer/>, que
corresponde a la rama `main`.

## Cómo reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub:

1. Ve a la pestaña **Security** del repositorio.
2. Pulsa **Report a vulnerability**.
3. Describe el problema, cómo reproducirlo y el impacto que prevés.

Recibirás una respuesta en un plazo de 7 días. Si el reporte se confirma, se
publicará una corrección y un aviso de seguridad, con crédito para quien lo
reportó si así lo desea.

## Alcance

La aplicación es 100 % client-side: no tiene backend, cuentas ni base de
datos. Son relevantes, por ejemplo:

- Ejecución de código (XSS) a partir de datos de la API de YouTube o de un
  archivo JSON importado.
- Formas de consumir la cuota de la API que eviten las protecciones previstas.
- Dependencias vulnerables que afecten al sitio publicado.

La clave de YouTube Data API y la site key de reCAPTCHA son **públicas por
diseño** (viajan en el JavaScript del sitio) y están restringidas por dominio
en Google Cloud. Que sean visibles no es, por sí mismo, una vulnerabilidad.

## Excepciones conocidas en dependencias

El CI audita solo las dependencias de producción (`npm audit --omit=dev`),
que son las que llegan al sitio publicado. Estas alertas de dependencias de
desarrollo están aceptadas de forma explícita:

| Alerta | Cadena | Motivo | Revisar |
| --- | --- | --- | --- |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (`braces` ≤ 3.0.3, DoS por patrones anidados) | `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces` | No existe versión corregida de `braces` (3.0.3 es la última). Solo se ejecuta al hacer lint con patrones propios del repositorio, nunca con entrada externa, y no forma parte del build publicado. | Cuando se publique una versión corregida de `braces` o `eslint-config-next` deje de depender de ella; entonces, actualizar o fijarla con `overrides`. |

## Respuesta ante incidentes

### Clave filtrada o abuso de cuota

Sigue el procedimiento de [Operación](README.md#operación) del README: rotar
la clave, actualizar el secret en GitHub y redeplegar.

### Sitio comprometido

Por ejemplo, una dependencia o acción maliciosa que llegó al build, un script
inyectado o un despliegue que no viene de `main`. El objetivo de la primera
hora es dejar de servir el código malicioso; la investigación viene después.

1. **Retirar el sitio.** En *Settings → Pages*, despublica el sitio
   (*Unpublish site*) y desactiva el workflow *CI / Deploy to Pages* en
   *Actions* para que ningún push lo vuelva a publicar.
2. **Identificar el origen.** Revisa en *Actions* qué ejecución hizo el
   despliegue afectado y qué commit construyó. Compara su SBOM (artefacto
   `sbom.cdx.json`) con el del último despliegue sano para ver qué
   dependencias cambiaron, y revisa los PR y las actualizaciones de
   Dependabot recientes.
3. **Corregir.** Revierte el commit o fija la versión sana de la dependencia
   (`overrides` en `package.json` si es transitiva). Si el atacante pudo
   leer secrets del workflow, rota también la clave de la API y la site key
   de reCAPTCHA.
4. **Volver a publicar.** Reactiva el workflow, comprueba que `verify` pasa
   y verifica el sitio publicado antes de dar el incidente por cerrado.
5. **Avisar.** Publica un *security advisory* en el repositorio con qué pasó,
   el intervalo de fechas afectado y qué debe hacer quien usó el sitio
   (por ejemplo, borrar los datos del sitio en el navegador). La aplicación
   no tiene cuentas ni datos personales en servidores, así que no hay
   personas a las que notificar individualmente.
