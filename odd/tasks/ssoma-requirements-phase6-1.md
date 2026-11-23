# Fase 6.1 — UX integral de Requerimientos SSOMA

## Objetivo

Ofrecer un flujo profesional de tres pasos para crear Requerimientos SSOMA y un
detalle coherente con trabajadores previstos, incorporaciones, correo y
seguimiento, reutilizando el sistema visual existente.

## Restricciones

- Sin worktrees, cambios de rama, commits, push, reset ni clean.
- Sin bibliotecas UI nuevas ni componentes paralelos.
- Sin romper Ropa de Trabajo, inventario, proyectos o flujos anteriores.

## Tareas

- [x] **FE-P61-01 — Auditar y consolidar estado del formulario actual**
- [x] **FE-P61-02 — Implementar editor de tres pasos y tres familias**
- [x] **FE-P61-03 — Implementar filas agrupadas y planificación desplegable**
- [x] **FE-P61-04 — Rediseñar detalle y seguimiento por familia**
- [x] **FE-P61-05 — Reutilizar modal de historial de Ropa de Trabajo**
- [x] **FE-P61-06 — Incorporaciones posteriores y correo versionado**
- [x] **FE-P61-07 — Administración de tallas autorizada**
- [x] **FE-P61-08 — Pruebas, build, lint y revisión visual si está disponible**

## Estrategia

- Ruta directa: la política del runtime prohíbe subagentes sin solicitud explícita.
- Entrega `exception-ok`: el usuario prohíbe commits.
- Pronóstico: 1,000–1,600 líneas autoradas.

## Verificación prevista

- Pruebas contractuales del formulario, detalle, historial y correo.
- TypeScript/Vite build, ESLint focalizado y `git diff --check`.

## Evidencia observada

- `npm run test:ssoma-requests`: 3 de 3 pruebas correctas.
- `npm run test:ssoma-work-clothing`: 7 de 7 pruebas correctas.
- ESLint focalizado: correcto.
- `npm run build`: TypeScript y Vite correctos; Vite mantiene la advertencia preexistente por un chunk mayor de 500 kB.
- `git diff --check` focalizado de Fase 6.1: correcto.
- No se realizó validación visual en navegador.

## Estado

Implementación completada. El detalle conserva acceso explícito al flujo legacy
de revisión, aprobación y atención, y las incorporaciones posteriores de Ropa de
Trabajo permiten definir trabajadores previstos sin alterar entregas reales.
