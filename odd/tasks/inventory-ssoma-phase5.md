# Fase 5 — Inventario y Recursos SSOMA

## Objetivo

Presentar Inventario y Recursos SSOMA como áreas independientes, reutilizando
el catálogo, formularios, tablas, hooks, permisos y operaciones existentes.

## Alcance autorizado

- Inventario con cinco familias nuevas aprobadas.
- Recursos SSOMA con Ropa de Trabajo, EPP y Equipos de Seguridad.
- Acceso secundario a registros legacy sin reclasificar.
- Rutas históricas compatibles y nueva ruta `/admin/ssoma-resources`.
- Formularios adaptados a las nuevas familias y controles.

## Restricciones

- Sin worktrees, clones, cambios de rama, reset, clean, commits ni push.
- Sin duplicar tablas, modales, botones o motores de inventario.
- Sin cambiar permisos o reglas de módulos ajenos.

## Tareas

- [x] **FE-P5-01 — Configuración central de áreas y familias**
- [x] **FE-P5-02 — Vistas separadas y navegación compatible**
- [x] **FE-P5-03 — Formularios de alta y edición**
- [x] **FE-P5-04 — Pruebas y validación frontend**

## Verificación prevista

- Pruebas focalizadas de clasificación, rutas y formularios.
- TypeScript + Vite build.
- ESLint focalizado.
- Revisión de acciones ghost, permisos, diff y estado Git.

## Estrategia de ejecución

- Ruta directa: el uso de subagentes está deshabilitado para esta solicitud por
  la política activa del runtime.
- Entrega `exception-ok`: el usuario prohibió commits.
- Pronóstico: 450–750 líneas autoradas.

## Evidencia de cierre

- Prueba contractual Fase 5: 5/5 correcta.
- Regresión de acciones ghost: 5/5 correcta.
- ESLint focalizado: 0 errores; 4 avisos preexistentes de Fast Refresh en AccessProvider.
- TypeScript + Vite build: correcto; se mantiene el aviso no bloqueante de chunk grande.
- Rutas legacy y permisos comprobados mediante prueba contractual y compilación.
- Sin validación visual en navegador y sin commits por restricción expresa del usuario.
