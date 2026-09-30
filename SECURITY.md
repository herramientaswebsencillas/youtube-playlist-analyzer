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

## Respuesta ante incidentes

Si una clave se filtra o se detecta abuso de cuota, sigue el procedimiento de
[Operación](README.md#operación) del README: rotar la clave, actualizar el
secret en GitHub y redeplegar.
