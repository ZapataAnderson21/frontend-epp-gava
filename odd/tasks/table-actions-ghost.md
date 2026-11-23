# Ajuste global UX/UI — Acciones Ghost en tablas

## Objetivo

Unificar las acciones icon-only de tablas y listados mediante un botón ghost accesible, conservando permisos, confirmaciones y variantes sólidas fuera de este contexto.

## Alcance autorizado

- Evolucionar ActionButton con una variante ghost reutilizable.
- Migrar SeeButton, EditButton y DeleteButton.
- Incorporar tooltip accesible fuera del overflow de tablas.
- Migrar acciones directas equivalentes en tablas y listados.
- Mantener botones principales con texto y lógica de negocio sin cambios.

## Restricciones

- Sin worktrees, clones, cambios de rama, reset, clean, commits ni push.
- Conservar íntegramente las Fases 1–4.1 y todos los cambios locales.
- Sin dependencias nuevas ni cambios de permisos.

## Estrategia

- Ruta directa: el modelo exacto gpt-6.1-luna del worker ODD no está disponible; no se sustituye.
- Entrega exception-ok porque el usuario prohíbe commits.
- Pronóstico: 500–900 líneas autoradas entre componentes, consumidores y pruebas.

## Tareas

- [x] **GA01 — Componente ghost y tooltip accesible**
  - Variante ghost primary/danger.
  - Tooltip por portal, visible con hover y focus.
  - Área 40x40, focus-visible, disabled y reduced-motion.
  - Compatibilidad con variante sólida.
- [x] **GA02 — Acciones compartidas y tablas principales**
  - SeeButton, EditButton y DeleteButton.
  - Proyectos, clientes, proveedores, recursos, compras, cotizaciones, trabajadores, usuarios y requerimientos.
  - Planillas STAFF y acciones PDF/Excel.
- [x] **GA03 — Acciones directas y listados especiales**
  - Inventario, ingresos, tareas, vencimientos, evaluaciones y tablas auxiliares.
  - Mantener confirmaciones destructivas y permisos.
- [x] **GA04 — Pruebas y auditoría**
  - Contratos accesibles, TypeScript, Vite build, ESLint focalizado y pruebas existentes.
  - Auditoría global de acciones no migradas con justificación.

## Criterios de aceptación

- Iconos primary sin fondo, borde ni sombra en reposo.
- Hover tenue, focus claro y tooltip accesible no recortado.
- Destructivos diferenciados solo de forma sutil.
- Permisos y confirmaciones existentes intactos.
- Botones principales con texto conservan su apariencia.

## Progreso

- GA01: variante ghost primary/danger, tooltip accesible por portal, área 40x40,
  foco, disabled y reduced-motion implementados; variante sólida conservada.
- GA02: wrappers compartidos y acciones de STAFF, compras globales, planillas
  semanales y ficha técnica migradas.
- GA03: acciones directas de inventario, ingresos, Gantt, condiciones/ítems de
  órdenes, vencimientos, evaluaciones y cotizaciones migradas sin cambiar la
  lógica de permisos ni las confirmaciones existentes.
- GA04: RED observado antes de la implementación (0/5); GREEN final (5/5).
  Build TypeScript + Vite correcto, ESLint focalizado correcto, 19 pruebas de
  regresión de STAFF/compras/cotizaciones correctas y `git diff --check` sin
  errores (solo advertencias de conversión LF/CRLF preexistentes).
- RDD: desactivado globalmente (`disabled/unmanaged`); no se inició revisión.
- Commits: no creados por restricción expresa del usuario.
