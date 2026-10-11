## Qué cambia y por qué

<!-- Describe el cambio y el motivo. Enlaza el issue si existe. -->

## Lista de verificación

- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm test` pasan.
- [ ] `npm run build` y `npm run test:e2e` pasan (el build necesita alguna `NEXT_PUBLIC_YOUTUBE_API_KEY`).
- [ ] Agregué o actualicé pruebas si cambié la lógica de `src/lib`.
- [ ] Actualicé el README, `.env.local.example`, el aviso de privacidad o los términos si cambian variables, comandos, datos tratados o proveedores.
- [ ] Si agregué un dominio externo, lo añadí a la CSP de `src/app/layout.tsx` y a `docs/amenazas.md`.
- [ ] Si cambié una decisión de `docs/adr/`, escribí un ADR nuevo que la reemplace.
- [ ] No incluye claves reales ni datos personales.
