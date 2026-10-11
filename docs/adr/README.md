# Registro de decisiones de arquitectura (ADR)

Cada archivo documenta una decisión con peso en el diseño: el contexto, lo
que se decidió, las alternativas descartadas y sus consecuencias. Antes de
revertir una de estas decisiones, lee su ADR; si cambia, escribe uno nuevo
que la reemplace en lugar de editar el anterior.

Las primeras cinco se registraron de forma retroactiva el 2026-10-11, a
partir del código y del historial de Git.

| # | Decisión | Estado |
| --- | --- | --- |
| [0001](0001-app-solo-cliente.md) | Aplicación 100 % en el navegador, sin backend | Aceptada |
| [0002](0002-recaptcha-sin-servidor.md) | reCAPTCHA invisible sin verificación en servidor | Aceptada (en revisión) |
| [0003](0003-csp-en-meta.md) | CSP declarada con `<meta>` | Aceptada |
| [0004](0004-localstorage-como-cache.md) | LocalStorage como caché e historial | Aceptada |
| [0005](0005-exportacion-solo-json.md) | Exportar e importar solo en JSON | Aceptada |

## Plantilla

```markdown
# NNNN. Título en forma de decisión

- **Estado:** Propuesta | Aceptada | Reemplazada por NNNN
- **Fecha:** AAAA-MM-DD

## Contexto
## Decisión
## Alternativas descartadas
## Consecuencias
```
