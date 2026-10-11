# 0002. reCAPTCHA invisible sin verificación en servidor

- **Estado:** Aceptada (en revisión, ver «Consecuencias»)
- **Fecha:** 2026-06-25 (commit `e0675f6`; registrada el 2026-10-11)

## Contexto

La cuota diaria de la YouTube Data API es compartida por todas las personas
que usan el sitio. Se quería disuadir el uso automatizado desde la interfaz.

## Decisión

Antes de cada análisis que consulta la API se ejecuta un reto reCAPTCHA v2
invisible (`src/lib/captcha/recaptcha.ts`). Los resultados leídos de la caché
no lo disparan. Si `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` está vacía, el reto se
omite.

## Alternativas descartadas

- **Verificar el token en `siteverify`:** requiere un servidor, que
  [0001](0001-app-solo-cliente.md) descarta.
- **Sin protección:** dejaría el abuso desde la propia interfaz sin ninguna
  fricción.

## Consecuencias

- El token no se verifica: el reto solo frena a quien usa la interfaz. Un
  script que extrae la clave del bundle y llama a la API directamente no
  pasa por el reto. El control real del abuso son los límites de cuota de
  Google Cloud.
- reCAPTCHA recoge datos del dispositivo (declarado en el aviso de
  privacidad), a cambio de una protección limitada.
- Está pendiente revisar esta decisión: reforzar los límites de cuota y
  retirar el reto, o agregar un proxy que verifique el token. Si se decide,
  este ADR se reemplaza por uno nuevo.
